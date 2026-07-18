import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, this would be a real database
const students = [
  {
    id: 1,
    student_number: "50763865",
    name: "Thandeka Confidence",
    surname: "Masangane",
    contact_details: "0123456789",
    res_address: "123 Student Village, Potchefstroom",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 2,
    student_number: "46985972",
    name: "Liyabona",
    surname: "Tokoyi",
    contact_details: "0123456790",
    res_address: "456 Campus Heights, Potchefstroom",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 3,
    student_number: "48497002",
    name: "Mbali",
    surname: "Dyobiso",
    contact_details: "0123456791",
    res_address: "789 University Residence, Potchefstroom",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
]

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const studentIndex = students.findIndex((s) => s.id === id)

    if (studentIndex === -1) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    students.splice(studentIndex, 1)
    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const studentIndex = students.findIndex((s) => s.id === id)

    if (studentIndex === -1) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    students[studentIndex] = {
      ...students[studentIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(students[studentIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}
