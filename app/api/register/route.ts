// /app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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

// Define type for frontend data
type FormData = {
  name: string;
  surname: string;
  email?: string;
  password: string;
  role: 'student' | 'driver';
  student_number?: string;
  license?: string;
  contact_details: string;
  res_name?: string;
  street_name?: string;
  house_number?: string;
};

export async function POST(req: NextRequest) {
  let connection;

  try {
    const data: FormData = await req.json();
    const {
      name,
      surname,
      password,
      email,
      role,
      student_number,
      license,
      contact_details,
      res_name,
      street_name,
      house_number,
    } = data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'student') {
      if (!student_number || !res_name || !street_name || !house_number) {
        return NextResponse.json(
          { message: 'All residence address fields are required for a student.' },
          { status: 400 }
        );
      }

      const [resAddressResult] = await connection.execute(
        'INSERT INTO res_address (Name, Street_Name, House_Number) VALUES (?, ?, ?)',
        [res_name, street_name, house_number]
      );
      const resId = (resAddressResult as any).insertId;

      await connection.execute(
        'INSERT INTO student (StudentNo, Email, Name, Surname, ContactDetails, Res_ID, Password, role) VALUES (?,?, ?, ?, ?, ?, ?, ?)',
        [student_number, email, name, surname, contact_details, resId, hashedPassword, role]
      );

    } else if (role === 'driver') {
      if (!license) {
        return NextResponse.json(
          { message: 'License is required for a driver.' },
          { status: 400 }
        );
      }
      await connection.execute(
        `INSERT INTO driver 
          (Name, Surname, Email, AvailabilityStatus, License, Password, ContactDetails, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, surname, email, 'Available', license, hashedPassword, contact_details, role]
      );
      

    } else {
      return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
    }

    await connection.commit();
    return NextResponse.json({ message: 'Registration successful!' }, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();

    console.error('Registration failed:', error);

    let userMessage = 'Registration failed due to a server error.';

    if (error.code) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          userMessage = 'Database error: One or more tables do not exist. Please check your database schema.';
          break;
        case 'ER_DUP_ENTRY':
          userMessage = 'A user with this information already exists.';
          break;
        case 'ER_BAD_FIELD_ERROR':
          userMessage = 'Database error: Column mismatch. Please check your schema.';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          userMessage = 'Database connection error: Access denied. Check MySQL credentials.';
          break;
        default:
          userMessage = `Database error: ${error.message}`;
      }
    } else {
      userMessage = error.message;
    }

    return NextResponse.json({ message: userMessage }, { status: 500 });

  } finally {
    if (connection) connection.release();
  }
}
