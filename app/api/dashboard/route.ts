import { NextResponse } from "next/server";
import mysql from 'mysql2/promise';

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

export async function GET() {
    try {
        // Test database connection
        await pool.getConnection();

        const [studentCountResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS totalStudents FROM student');
        const [driverCountResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS totalDrivers FROM driver');
        const [vehicleCountResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS totalVehicles FROM vehicle');
        const [totalRequestsResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS totalRequests FROM `request`');
        const [pendingRequestsResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS pendingRequests FROM `request` WHERE RequestStatus = \'pending\'');
        const [completedTodayResult] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS completedToday FROM `request` WHERE RequestStatus = \'completed\' AND DATE(PickupTime) = CURDATE()');
        const [vehicleStatusResult] = await pool.query<mysql.RowDataPacket[]>('SELECT status, COUNT(*) as count FROM vehicle GROUP BY status');

        const dashboardData = {
            totalStudents: (studentCountResult[0] && studentCountResult[0].totalStudents) ? studentCountResult[0].totalStudents : 0,
            totalDrivers: (driverCountResult[0] && driverCountResult[0].totalDrivers) ? driverCountResult[0].totalDrivers : 0,
            totalVehicles: (vehicleCountResult[0] && vehicleCountResult[0].totalVehicles) ? vehicleCountResult[0].totalVehicles : 0,
            totalRequests: (totalRequestsResult[0] && totalRequestsResult[0].totalRequests) ? totalRequestsResult[0].totalRequests : 0,
            pendingRequests: (pendingRequestsResult[0] && pendingRequestsResult[0].pendingRequests) ? pendingRequestsResult[0].pendingRequests : 0,
            completedToday: (completedTodayResult[0] && completedTodayResult[0].completedToday) ? completedTodayResult[0].completedToday : 0,
            // Active requests would require a separate real-time service, so we'll use a placeholder for now.
            activeRequests: 0,
            vehicleStatus: vehicleStatusResult || [],
        };

        return NextResponse.json(dashboardData);

    } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        let errorMessage = "Failed to fetch dashboard data.";
        
        // Check for specific MySQL errors and provide a more useful message
        if (error.code) {
          switch (error.code) {
            case 'ECONNREFUSED':
              errorMessage = 'Connection refused. The database server is likely not running or the connection details are incorrect.';
              break;
            case 'ER_ACCESS_DENIED_ERROR':
              errorMessage = 'Access denied. Check your MySQL username and password in the route file.';
              break;
            case 'ER_BAD_DB_ERROR':
              errorMessage = 'Unknown database. The specified database "unilift" does not exist.';
              break;
            case 'ER_BAD_FIELD_ERROR':
                errorMessage = `Database error: Unknown column '${error.sqlMessage.match(/Unknown column '(.*?)'/)[1]}' in 'where clause'. Please check your database schema.`;
                break;
            default:
              errorMessage = `Database error: ${error.message}`;
          }
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
