import { type NextRequest, NextResponse } from "next/server";
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

export interface Driver {
    Driver_ID: number;
    Name: string;
    Surname: string;
    Email: string;
    AvailabilityStatus: string;
    License: string;
    Password?: string; // Made optional for updates
    ContactDetails: string;
}

async function getAllDrivers(): Promise<Driver[]> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM driver');
    return rows as Driver[];
}

async function getDriverById(id: number): Promise<Driver | null> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM driver WHERE Driver_ID = ?', [id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Driver;
}

async function createDriver(newDriver: Omit<Driver, 'Driver_ID'>): Promise<number> {
    const { Name, Surname, Email, AvailabilityStatus, License, Password, ContactDetails } = newDriver;
    const [result] = await pool.query('INSERT INTO driver (Name, Surname, Email, AvailabilityStatus, License, Password, ContactDetails) VALUES (?, ?, ?, ?, ?, ?, ?)', [Name, Surname, Email, AvailabilityStatus, License, Password, ContactDetails]);
    return (result as mysql.ResultSetHeader).insertId;
}

async function updateDriver(id: number, updatedDriver: Partial<Omit<Driver, 'Driver_ID'>>): Promise<boolean> {
    const fields = Object.keys(updatedDriver);
    const values = Object.values(updatedDriver);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const [result] = await pool.query(`UPDATE driver SET ${setClause} WHERE Driver_ID = ?`, [...values, id]);
    return (result as mysql.ResultSetHeader).affectedRows > 0;
}

async function deleteDriver(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM driver WHERE Driver_ID = ?', [id]);
    return (result as mysql.ResultSetHeader).affectedRows > 0;
}

export async function GET() {
    try {
        const drivers = await getAllDrivers();
        return NextResponse.json(drivers);
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const newDriverId = await createDriver(body);
        const newDriver = await getDriverById(newDriverId);
        return NextResponse.json(newDriver, { status: 201 });
    } catch (error) {
        console.error("Error creating driver:", error);
        return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const driverId = parseInt(urlParts[urlParts.length - 1]);
        const body = await request.json();

        if (isNaN(driverId)) {
            return NextResponse.json({ error: "Invalid driver ID" }, { status: 400 });
        }

        const success = await updateDriver(driverId, body);

        if (success) {
            const updatedDriver = await getDriverById(driverId);
            return NextResponse.json(updatedDriver);
        } else {
            return NextResponse.json({ error: "Driver not found or no changes made" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error updating driver:", error);
        return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const driverId = parseInt(urlParts[urlParts.length - 1]);

        if (isNaN(driverId)) {
            return NextResponse.json({ error: "Invalid driver ID" }, { status: 400 });
        }

        const success = await deleteDriver(driverId);

        if (success) {
            return new NextResponse(null, { status: 204 });
        } else {
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error deleting driver:", error);
        return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
    }
}