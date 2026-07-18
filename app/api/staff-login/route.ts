// /app/api/driver-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Define constants for the admin user
const ADMIN_USERNAME = 'admin@unilift.com';
const ADMIN_PASSWORD = 'adminpassword123';

// Database connection pool
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

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { email, password } = await req.json();
    connection = await pool.getConnection();

    let user: RowDataPacket | null = null;

    // --- Admin Login Check ---
    // Check if the provided credentials match the hardcoded admin constants
    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // For simplicity, we don't hash the admin password.
      // In a production environment, this should be handled more securely.
      const adminUser = {
        id: 'admin_id_001',
        email: ADMIN_USERNAME,
        role: 'admin',
        name: 'UniLift',
        surname: 'Admin',
      };
      console.log('Admin login successful');
      return NextResponse.json({ user: adminUser }, { status: 200 });
    }

    // 1️⃣ Check driver table
    const [driverRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        d.Driver_ID,
        d.Name,
        d.Surname,
        d.Email,
        d.License,
        d.AvailabilityStatus,
        d.role,
        d.Password
      FROM driver d
      WHERE d.Email = ?`,
      [email]
    );

    if (driverRows.length > 0) {
      user = driverRows[0];
    }

    // 2️⃣ User not found
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // 3️⃣ Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.Password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // 4️⃣ Successful login
    const { Password, Driver_ID, ...userWithoutPassword } = user;

    // ✅ inside driver-login route after successful login
  return NextResponse.json({
    message: 'Login successful!',
    user: {
      driver_id: Driver_ID,
      name: user.Name,       // 🔥 lowercase for React
      surname: user.Surname, // 🔥 lowercase for React
      email: user.Email,
      license: user.License,
      availabilityStatus: user.AvailabilityStatus,
      role: user.role,
    },
  }, { status: 200 });


  } catch (error: any) {
    console.error('login failed:', error);
    const userMessage =
      error.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Database connection error: Check MySQL credentials.'
        : 'An unexpected error occurred.';
    return NextResponse.json({ message: userMessage }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
