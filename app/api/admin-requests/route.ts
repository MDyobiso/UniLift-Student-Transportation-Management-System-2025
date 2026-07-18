// /app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create a connection pool to the Unilift database
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

/**
 * Handles GET requests to retrieve all requests.
 */
export async function GET() {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT `Request_ID`, `Stud_ID`, `PickupLocation`, `Destination`, `RequestStatus`, `PickupTime`, `notes` FROM `request`');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    let userMessage = 'Failed to fetch requests due to a server error.';

    if (error.code) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          userMessage = 'Database error: The `request` table does not exist.';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          userMessage = 'Database connection error: Access denied. Check your MySQL credentials in the route file.';
          break;
        case 'ECONNREFUSED':
          userMessage = 'Connection refused. The database server is likely not running.';
          break;
        case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
        case 'ER_TOO_MANY_CONNECTIONS':
          userMessage = 'Database connection error: Too many active connections. Please try again later or restart your server.';
          break;
        default:
          userMessage = `Database error: ${error.message}`;
      }
    }

    return NextResponse.json({ message: userMessage }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Handles POST requests to create a new ride request.
 */
export async function POST(request: NextRequest) {
  let connection = null;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const body: any = await request.json();
    const { Stud_ID, PickupLocation, pickup_time, Destination, notes } = body;

    const [result] = await connection.execute(
      `INSERT INTO \`request\` (\`Stud_ID\`, \`PickupLocation\`, \`PickupTime\`, \`Destination\`, \`RequestStatus\`, \`notes\`)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [Stud_ID, PickupLocation, pickup_time, Destination, notes]
    );

    await connection.commit();

    return NextResponse.json(
      { message: 'Ride request submitted successfully!', requestId: (result as any).insertId },
      { status: 201 }
    );
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Ride request failed:', error);
    return NextResponse.json({ message: 'Failed to submit ride request due to a server error.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}