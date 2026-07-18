// /app/api/reports/route.ts
import { NextResponse } from 'next/server';
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
  let connection = null;
  try {
    connection = await pool.getConnection();

    // Query for Peak Hours Analysis
    const [peakHoursResult] = await connection.query(`
      SELECT HOUR(PickupTime) AS hour, COUNT(*) AS volume
      FROM request
      GROUP BY hour
      ORDER BY hour
    `);

    // Query for Most Popular Routes
    const [popularRoutesResult] = await connection.query(`
      SELECT PickupLocation, Destination, COUNT(*) AS volume
      FROM request
      GROUP BY PickupLocation, Destination
      ORDER BY volume DESC
      LIMIT 5
    `);

    // Query for Monthly Ride Trends
    const [monthlyTrendsResult] = await connection.query(`
      SELECT
        DATE_FORMAT(PickupTime, '%b') AS month,
        COUNT(Request_ID) AS rides,
        COUNT(DISTINCT Stud_ID) AS students
      FROM request
      WHERE RequestStatus = 'completed'
      GROUP BY month
      ORDER BY MIN(PickupTime)
    `);

    // Query for Driver Performance (total rides)
    const [driverPerformanceResult] = await connection.query(`
      SELECT
        d.Driver_ID,
        d.Name,
        d.Surname,
        COUNT(r.Request_ID) AS totalRides
      FROM driver AS d
      LEFT JOIN request AS r ON d.Driver_ID = r.Driver_ID
      GROUP BY d.Driver_ID, d.Name, d.Surname
    `);

    // Query for Vehicle Status Distribution
    const [vehicleStatusResult] = await connection.query(`
      SELECT
        Status AS status,
        COUNT(*) AS count
      FROM vehicle
      GROUP BY Status
    `);

    // Combine all results into a single object
    const reportsData = {
      peakHours: peakHoursResult,
      popularRoutes: popularRoutesResult,
      monthlyTrends: monthlyTrendsResult,
      driverPerformance: driverPerformanceResult,
      vehicleStatus: vehicleStatusResult,
    };

    return NextResponse.json(reportsData);

  } catch (error: any) {
    console.error("Error fetching reports data:", error);
    let errorMessage = "Failed to fetch reports data.";
    if (error.code) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          errorMessage = 'Database error: One of the required tables does not exist.';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          errorMessage = 'Database connection error: Access denied.';
          break;
        case 'ECONNREFUSED':
          errorMessage = 'Connection refused. The database server is likely not running.';
          break;
        default:
          errorMessage = `Database error: ${error.message}`;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
