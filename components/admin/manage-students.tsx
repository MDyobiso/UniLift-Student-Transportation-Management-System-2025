"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, User, Phone, MapPin } from "lucide-react"

interface Student {
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

interface StudentFormData {
    Student_No: string;
    Email: string;
    Name: string;
    Surname: string;
    ContactDetails: string;
    Res_ID: string;
}

// Mock data for residences as the database table was not provided
const residences = [
    { Res_ID: 1, Name: "Fanie du Toit" },
    { Res_ID: 2, Name: "Vergeet-My-Nie" },
    { Res_ID: 3, Name: "Oud-Huis" },
    { Res_ID: 4, Name: "Heide" },
    { Res_ID: 5, Name: "Villagers" },
];

export function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<StudentFormData>({
    Student_No: "",
    Email: "",
    Name: "",
    Surname: "",
    ContactDetails: "",
    Res_ID: "",
  })

  const filteredStudents = students.filter(
    (student) =>
      student.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.Surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.Student_No.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
          console.error("[v0] Failed to fetch students. Server response:", await response.json());
      }
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
    }
  }
  
  const handleAddStudent = async () => {
    setErrorMessage(null);
    if (!formData.Student_No || !formData.Email || !formData.Name || !formData.Surname || !formData.ContactDetails || !formData.Res_ID) {
        setErrorMessage("Please fill out all fields.");
        return;
    }

    setIsLoading(true);

    try {
        const newStudentData = {
            ...formData,
            Res_ID: parseInt(formData.Res_ID),
            role: "student", // Default role for new students
            Password: "password123", // Placeholder password as it's required by the table
        };

        const response = await fetch("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newStudentData),
        });

        if (response.ok) {
            const newStudent = await response.json();
            setStudents([...students, newStudent]);
            setFormData({
                Student_No: "",
                Email: "",
                Name: "",
                Surname: "",
                ContactDetails: "",
                Res_ID: "",
            });
            setIsAddDialogOpen(false);
        } else {
            const errorData = await response.json();
            const errorMsg = errorData.error || "Failed to add student. Server response: {}";
            setErrorMessage(errorMsg);
            console.error("[v0] Failed to add student. Server response:", errorData);
        }
    } catch (error) {
        console.error("[v0] Error adding student:", error);
        setErrorMessage("An unknown error occurred. Please check your connection.");
    } finally {
        setIsLoading(false);
    }
  }

  const handleEditStudent = (student: Student) => {
    setErrorMessage(null)
    setEditingStudent(student)
    setFormData({
      Student_No: student.Student_No,
      Email: student.Email,
      Name: student.Name,
      Surname: student.Surname,
      ContactDetails: student.ContactDetails,
      Res_ID: student.Res_ID.toString(),
    })
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return
    setErrorMessage(null);
    setIsLoading(true);

    if (!formData.Student_No || !formData.Email || !formData.Name || !formData.Surname || !formData.ContactDetails || !formData.Res_ID) {
        setErrorMessage("Please fill out all fields.");
        setIsLoading(false);
        return;
    }

    try {
        const updatedStudentData = {
            ...formData,
            Res_ID: parseInt(formData.Res_ID),
        };
        const response = await fetch(`/api/students/${editingStudent.Stud_ID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedStudentData),
        });

        if (response.ok) {
            const updatedStudent = await response.json();
            setStudents(students.map((s) => (s.Stud_ID === editingStudent.Stud_ID ? updatedStudent : s)));
            setEditingStudent(null);
            setFormData({
                Student_No: "",
                Email: "",
                Name: "",
                Surname: "",
                ContactDetails: "",
                Res_ID: "",
            });
        } else {
            const errorData = await response.json();
            const errorMsg = errorData.error || "Failed to update student.";
            setErrorMessage(errorMsg);
            console.error("[v0] Failed to update student. Server response:", errorData);
        }
    } catch (error) {
        console.error("[v0] Error updating student:", error);
        setErrorMessage("An unknown error occurred. Please check your connection.");
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteStudent = async (id: number) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStudents(students.filter((s) => s.Stud_ID !== id));
      } else {
          console.error("[v0] Failed to delete student. Server response:", await response.json());
      }
    } catch (error) {
      console.error("[v0] Error deleting student:", error);
    }
  }
  
  const updateFormData = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Manage Students</h1>
          <p className="text-muted-foreground">Add, edit, and manage student data</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter the student information to add them to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Jane"
                    value={formData.Name}
                    onChange={(e) => updateFormData("Name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    placeholder="Doe"
                    value={formData.Surname}
                    onChange={(e) => updateFormData("Surname", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.Email}
                  onChange={(e) => updateFormData("Email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_number">Student Number</Label>
                <Input
                  id="student_number"
                  placeholder="50763865"
                  value={formData.Student_No}
                  onChange={(e) => updateFormData("Student_No", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_details">Contact Number</Label>
                <Input
                  id="contact_details"
                  placeholder="0123456789"
                  value={formData.ContactDetails}
                  onChange={(e) => updateFormData("ContactDetails", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res_id">Residence</Label>
                <select
                  id="res_id"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring focus:ring-blue-500 focus:border-blue-500"
                  value={formData.Res_ID}
                  onChange={(e) => updateFormData("Res_ID", e.target.value)}
                  required
                >
                  <option value="">Select a residence</option>
                  {residences.map((res) => (
                    <option key={res.Res_ID} value={res.Res_ID}>
                      {res.Name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAddStudent} className="w-full" disabled={isLoading}>
                {isLoading ? "Adding Student..." : "Add Student"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {students.length} students registered
        </Badge>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
          <CardDescription>Complete list of students in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Info</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Residence</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.Stud_ID}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="grid gap-0.5">
                        <span className="font-medium">
                          {student.Name} {student.Surname}
                        </span>
                        <span className="text-xs text-muted-foreground">{student.Student_No}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {student.ContactDetails}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {residences.find(r => r.Res_ID === student.Res_ID)?.Name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.Stud_ID)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.Name}
                  onChange={(e) => updateFormData("Name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-surname">Surname</Label>
                <Input
                  id="edit-surname"
                  value={formData.Surname}
                  onChange={(e) => updateFormData("Surname", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.Email}
                onChange={(e) => updateFormData("Email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-student_number">Student Number</Label>
              <Input
                id="edit-student_number"
                value={formData.Student_No}
                onChange={(e) => updateFormData("Student_No", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact_details">Contact Number</Label>
              <Input
                id="edit-contact_details"
                value={formData.ContactDetails}
                onChange={(e) => updateFormData("ContactDetails", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-res_id">Residence</Label>
              <select
                id="edit-res_id"
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring focus:ring-blue-500 focus:border-blue-500"
                value={formData.Res_ID}
                onChange={(e) => updateFormData("Res_ID", e.target.value)}
                required
              >
                  <option value="">Select a residence</option>
                  {residences.map((res) => (
                    <option key={res.Res_ID} value={res.Res_ID}>
                      {res.Name}
                    </option>
                  ))}
              </select>
            </div>
            <Button onClick={handleUpdateStudent} className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Student..." : "Update Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
