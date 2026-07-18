"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Car, Users } from "lucide-react"

// Define the type for a vehicle based on the database schema
interface Vehicle {
  Vehicle_ID: number;
  Model: string;
  Plate_Number: string;
  Capacity: number;
  Type: string;
  Driver_ID: number;
}

// Define the type for a driver
interface Driver {
  Driver_ID: number;
  Name: string;
  Surname: string;
}

interface VehicleFormData {
  Model: string;
  Plate_Number: string;
  Capacity: string;
  Type: string;
  Driver_ID: string;
}

export function ManageVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [unassignedDrivers, setUnassignedDrivers] = useState<Driver[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<VehicleFormData>({
    Model: "",
    Plate_Number: "",
    Capacity: "",
    Type: "",
    Driver_ID: "",
  });

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.Model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.Plate_Number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    const fetchData = async () => {
      await fetchVehicles()
      await fetchDrivers()
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Determine which drivers are unassigned
    const assignedDriverIds = new Set(vehicles.map(v => v.Driver_ID));
    const unassigned = drivers.filter(d => !assignedDriverIds.has(d.Driver_ID));
    setUnassignedDrivers(unassigned);
  }, [vehicles, drivers]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/admin-vehicles")
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("[v0] Error fetching vehicles:", error.message)
      } else {
        console.error("[v0] An unknown error occurred while fetching vehicles.")
      }
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/drivers")
      if (response.ok) {
        const data = await response.json()
        setDrivers(data)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("[v0] Error fetching drivers:", error.message)
      } else {
        console.error("[v0] An unknown error occurred while fetching drivers.")
      }
    }
  }

  const handleAddVehicle = async () => {
    setIsLoading(true)
    try {
      const driverId = formData.Driver_ID === "unassigned" ? null : Number.parseInt(formData.Driver_ID);
      const vehicleData = {
        Model: formData.Model,
        Plate_Number: formData.Plate_Number,
        Capacity: Number.parseInt(formData.Capacity),
        Type: formData.Type,
        Driver_ID: driverId,
      }

      const response = await fetch("/api/admin-vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      })

      if (response.ok) {
        const newVehicle = await response.json()
        setVehicles([...vehicles, newVehicle])
        setFormData({ Model: "", Plate_Number: "", Capacity: "", Type: "", Driver_ID: "" })
        setIsAddDialogOpen(false)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("[v0] Error adding vehicle:", error.message)
      } else {
        console.error("[v0] An unknown error occurred while adding a vehicle.")
      }
    }
    setIsLoading(false)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setErrorMessage(null);
    setEditingVehicle(vehicle)
    setFormData({
      Model: vehicle.Model,
      Plate_Number: vehicle.Plate_Number,
      Capacity: vehicle.Capacity.toString(),
      Type: vehicle.Type,
      Driver_ID: vehicle.Driver_ID !== null ? vehicle.Driver_ID.toString() : "unassigned",
    })
  }

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return

    setIsLoading(true)
    setErrorMessage(null);

    // More specific client-side validation
    if (!formData.Plate_Number) {
        setErrorMessage("Plate Number is required.");
        setIsLoading(false);
        return;
    }

    const driverId = formData.Driver_ID !== "unassigned" ? Number.parseInt(formData.Driver_ID) : null;
    if (driverId !== null && isNaN(driverId)) {
      setErrorMessage("Invalid driver selected.");
      setIsLoading(false);
      return;
    }

    try {
      const vehicleData = {
        Plate_Number: formData.Plate_Number,
        Driver_ID: driverId,
      }

      const response = await fetch(`/api/admin-vehicles/${editingVehicle.Vehicle_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      })

      if (response.ok) {
        const updatedVehicle = await response.json()
        setVehicles(vehicles.map((v) => (v.Vehicle_ID === editingVehicle.Vehicle_ID ? updatedVehicle : v)))
        setEditingVehicle(null)
        setFormData({ Model: "", Plate_Number: "", Capacity: "", Type: "", Driver_ID: "" })
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || "Failed to update vehicle. Please try again.";
        setErrorMessage(errorMsg);
        console.error("[v0] Error updating vehicle:", errorMsg);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        console.error("[v0] Error updating vehicle:", error.message)
      } else {
        setErrorMessage("An unknown error occurred.");
        console.error("[v0] An unknown error occurred while updating a vehicle.")
      }
    }
    setIsLoading(false)
  }

  const handleDeleteVehicle = async (id: number) => {
    try {
      const response = await fetch(`/api/admin-vehicles/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setVehicles(vehicles.filter((v) => v.Vehicle_ID !== id))
      } else {
        console.error("[v0] Failed to delete vehicle")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("[v0] Error deleting vehicle:", error.message)
      } else {
        console.error("[v0] An unknown error occurred while deleting a vehicle.")
      }
    }
  }

  const updateFormData = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }))
  }
  
  const handleModelChange = (value: string) => {
    let capacity = "";
    switch (value) {
      case "Minibus":
        capacity = "14";
        break;
      case "Bus":
        capacity = "35";
        break;
      case "Avanza (Max 7 seater)":
        capacity = "7";
        break;
      default:
        capacity = "";
    }
    setFormData(prev => ({ ...prev, Type: value, Capacity: capacity }));
  }

  const getDriverName = (driverId: number | null) => {
    if (driverId === null) return "Unassigned";
    const driver = drivers.find(d => d.Driver_ID === driverId);
    return driver ? `${driver.Name} ${driver.Surname}` : "N/A";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Manage Vehicles</h1>
          <p className="text-muted-foreground">Add, edit, and manage fleet vehicles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Enter the vehicle information to add it to the fleet.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="Toyota Quantum"
                  value={formData.Model}
                  onChange={(e) => updateFormData("Model", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate_number">Plate Number</Label>
                  <Input
                    id="plate_number"
                    placeholder="NWU005GP"
                    value={formData.Plate_Number}
                    onChange={(e) => updateFormData("Plate_Number", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="14"
                    value={formData.Capacity}
                    onChange={(e) => updateFormData("Capacity", e.target.value)}
                    disabled
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Vehicle Model</Label>
                <Select value={formData.Type} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Avanza (Max 7 seater)">Avanza (Max 7 seater)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver_id">Assign Driver</Label>
                <Select value={formData.Driver_ID} onValueChange={(value) => updateFormData("Driver_ID", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {unassignedDrivers.map(driver => (
                      <SelectItem key={driver.Driver_ID} value={driver.Driver_ID.toString()}>
                        {driver.Name} {driver.Surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddVehicle} className="w-full" disabled={isLoading}>
                {isLoading ? "Adding Vehicle..." : "Add Vehicle"}
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
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {vehicles.length} vehicles registered
        </Badge>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>Complete list of vehicles in the fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Info</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.Vehicle_ID}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{vehicle.Model}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{vehicle.Plate_Number}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {vehicle.Capacity} passengers
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getDriverName(vehicle.Driver_ID)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditVehicle(vehicle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteVehicle(vehicle.Vehicle_ID)}>
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
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update the vehicle information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errorMessage && (
              <div className="bg-red-500 text-white p-3 rounded-md">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.Model}
                disabled
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plate_number">Plate Number</Label>
                <Input
                  id="edit-plate_number"
                  value={formData.Plate_Number}
                  onChange={(e) => updateFormData("Plate_Number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.Capacity}
                  disabled
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-type">Vehicle Model</Label>
                <Select value={formData.Type} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Avanza (Max 7 seater)">Avanza (Max 7 seater)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="space-y-2">
              <Label htmlFor="edit-driver_id">Assign Driver</Label>
              <Select value={formData.Driver_ID} onValueChange={(value) => updateFormData("Driver_ID", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassign Driver</SelectItem>
                  {unassignedDrivers.map(driver => (
                    <SelectItem key={driver.Driver_ID} value={driver.Driver_ID.toString()}>
                      {driver.Name} {driver.Surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateVehicle} className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Vehicle..." : "Update Vehicle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
