// app/api/student-dashboard/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

// MySQL pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'unilift',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Define RequestRow type
interface RequestRow extends RowDataPacket {
  id: number;
  student_id: number;
  driver_id: number | null;
  pickup_time: string;
  pickup_location: string;
  destination: string;
  notes: string | null;
  status: string;
  rating: number | null;
  notified: number;
  created_at: string;
  updated_at: string;
}

// Define StudentProfile type
interface StudentProfile extends RowDataPacket {
  Stud_ID: number;
  StudentNo: string;
  Name: string;
  Surname: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  if (!id) return NextResponse.json({ message: 'Student ID is required.' }, { status: 400 });

  let connection;
  try {
    connection = await pool.getConnection();

    // 1️⃣ Fetch student profile
    const [profileRows] = await connection.execute<StudentProfile[]>(
      `SELECT Stud_ID, StudentNo, Name, Surname
       FROM student
       WHERE Stud_ID = ?`,
      [id]
    );

    if (profileRows.length === 0) {
      return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }

    const student = profileRows[0];

    // 2️⃣ Fetch all requests
    const [requestsRows] = await connection.execute<RequestRow[]>(
      `SELECT
        Request_ID AS id,
        Stud_ID AS student_id,
        Driver_ID AS driver_id,
        PickupTime AS pickup_time,
        PickupLocation AS pickup_location,
        Destination AS destination,
        Notes AS notes,
        RequestStatus AS status,
        Rating AS rating,
        Notified AS notified,
        Created_At AS created_at,
        Updated_At AS updated_at
       FROM request
       WHERE Stud_ID = ?
       ORDER BY Created_At DESC`,
      [id]
    );

    const requests = requestsRows;

    // 3️⃣ Notification check: mark requests as notified if not already
    const notifyStatuses = ['Pending', 'Assigned', 'In_Progress'];
    for (const req of requests) {
      if (notifyStatuses.includes(req.status) && req.notified === 0) {
        console.log(`Sending notification for request ${req.id} (status: ${req.status})`);
        await connection.execute(
          `UPDATE request SET Notified = 1 WHERE Request_ID = ?`,
          [req.id]
        );
        req.notified = 1; // update locally
      }
    }

    // 4️⃣ Calculate dashboard stats
    const totalRides = requests.filter(req => req.status === 'Completed').length;
    const activeRequests = requests.filter(req => notifyStatuses.includes(req.status)).length;

    const completedRequestsWithRating = requests.filter(req => req.status === 'Completed' && req.rating !== null);
    const sumRatings = completedRequestsWithRating.reduce((sum: number, req: RequestRow) => sum + (req.rating ?? 0), 0);
    const averageRating = completedRequestsWithRating.length > 0 ? sumRatings / completedRequestsWithRating.length : 0;

    // 5️⃣ Return response
    return NextResponse.json({
      profile: {
        stud_id: student.Stud_ID,
        studentNo: student.StudentNo,
        name: student.Name,
        surname: student.Surname,
      },
      stats: { totalRides, activeRequests, averageRating },
      requests: requests,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch student dashboard data:', error);
    return NextResponse.json({ message: 'Failed to fetch student dashboard.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
