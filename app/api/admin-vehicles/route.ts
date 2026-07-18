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

export interface Vehicle {
    Vehicle_ID: number;
    Model: string;
    Plate_Number: string;
    Capacity: number;
    Driver_ID: number;
}

async function getAllVehicles(): Promise<Vehicle[]> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM vehicle');
    return rows as Vehicle[];
}

async function getVehicleById(id: number): Promise<Vehicle | null> {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM vehicle WHERE Vehicle_ID = ?', [id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Vehicle;
}

async function createVehicle(newVehicle: Omit<Vehicle, 'Vehicle_ID'>): Promise<number> {
    const { Model, Plate_Number, Capacity, Driver_ID } = newVehicle;
    const [result] = await pool.query('INSERT INTO vehicle (Model, Plate_Number, Capacity, Driver_ID) VALUES (?, ?, ?, ?)', [Model, Plate_Number, Capacity, Driver_ID]);
    return (result as mysql.ResultSetHeader).insertId;
}

async function updateVehicle(id: number, updatedVehicle: Partial<Omit<Vehicle, 'Vehicle_ID'>>): Promise<boolean> {
    const fields = Object.keys(updatedVehicle);
    const values = Object.values(updatedVehicle);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const [result] = await pool.query(`UPDATE vehicle SET ${setClause} WHERE Vehicle_ID = ?`, [...values, id]);
    return (result as mysql.ResultSetHeader).affectedRows > 0;
}

async function deleteVehicle(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM vehicle WHERE Vehicle_ID = ?', [id]);
    return (result as mysql.ResultSetHeader).affectedRows > 0;
}

export async function GET() {
    try {
        const vehicles = await getAllVehicles();
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const newVehicleId = await createVehicle(body);
        const newVehicle = await getVehicleById(newVehicleId);
        return NextResponse.json(newVehicle, { status: 201 });
    } catch (error) {
        console.error("Error creating vehicle:", error);
        return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const vehicleId = parseInt(urlParts[urlParts.length - 1]);
        const body = await request.json();

        if (isNaN(vehicleId)) {
            return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
        }

        const success = await updateVehicle(vehicleId, body);

        if (success) {
            const updatedVehicle = await getVehicleById(vehicleId);
            return NextResponse.json(updatedVehicle);
        } else {
            return NextResponse.json({ error: "Vehicle not found or no changes made" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error updating vehicle:", error);
        return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const urlParts = request.url.split('/');
        const vehicleId = parseInt(urlParts[urlParts.length - 1]);

        if (isNaN(vehicleId)) {
            return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
        }

        const success = await deleteVehicle(vehicleId);

        if (success) {
            return new NextResponse(null, { status: 204 });
        } else {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
    }
}
