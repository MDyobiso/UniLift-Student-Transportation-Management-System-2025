import { type NextRequest, NextResponse } from "next/server";
import mysql from 'mysql2/promise';

// NOTE: This assumes a running MySQL database with the unilift schema.
// Please ensure your database is running and accessible.
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

export interface Student {
    Stud_ID: number;
    Student_No: string;
    Email: string;
    Name: string;
    Surname: string;
    ContactDetails: string;
    Res_ID: number;
    role: string;
    Password?: string;
}

// --- Database Helper Functions ---
// In a real application, you would separate these into a service or repository layer.

async function getAllStudents(): Promise<Student[]> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM student');
    return rows as Student[];
}

async function getStudentById(id: number): Promise<Student | null> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM student WHERE Stud_ID = ?', [id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Student;
}

async function createStudent(newStudent: Omit<Student, 'Stud_ID'>): Promise<number> {
    const { Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role } = newStudent;
    const [result] = await pool.query('INSERT INTO student (Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role]);
    return (result as any).insertId;
}

async function updateStudent(id: number, updatedStudent: Partial<Student>): Promise<boolean> {
    const { Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role } = updatedStudent;
    const [result] = await pool.query('UPDATE student SET Student_No = ?, Email = ?, Name = ?, Surname = ?, ContactDetails = ?, Res_ID = ?, Password = ?, role = ? WHERE Stud_ID = ?', [Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role, id]);
    return (result as any).affectedRows > 0;
}

async function deleteStudent(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM student WHERE Stud_ID = ?', [id]);
    return (result as any).affectedRows > 0;
}

// --- API Route Handlers ---

export async function GET() {
    try {
        const students = await getAllStudents();
        return NextResponse.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("Received POST request with body:", body); // Log the request body
        const { Student_No, Email, Name, Surname, ContactDetails, Res_ID, Password, role } = body;

        if (!Student_No || !Email || !Name || !Surname || !ContactDetails || !Res_ID) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const newStudentId = await createStudent(body);
        const newStudent = await getStudentById(newStudentId);

        return NextResponse.json(newStudent, { status: 201 });
    } catch (error: any) {
        console.error("Error creating student:", error); // Log the specific error object
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "A student with this number or email already exists." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create student. Please check your inputs. Error: " + error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const studentId = parseInt(urlParts[urlParts.length - 1]);
        const body = await request.json();

        if (isNaN(studentId)) {
            return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
        }

        const success = await updateStudent(studentId, body);

        if (success) {
            const updatedStudent = await getStudentById(studentId);
            return NextResponse.json(updatedStudent);
        } else {
            return NextResponse.json({ error: "Student not found or no changes made" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error updating student:", error);
        return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const studentId = parseInt(urlParts[urlParts.length - 1]);

        if (isNaN(studentId)) {
            return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
        }

        const success = await deleteStudent(studentId);

        if (success) {
            return new NextResponse(null, { status: 204 });
        } else {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }
}
