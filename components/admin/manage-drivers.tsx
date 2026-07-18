"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, User, Phone, CreditCard, ArrowUp, ArrowDown } from "lucide-react"

// Define the type for a driver based on the database schema
interface Driver {
  Driver_ID: number;
  Name: string;
  Surname: string;
  Email: string;
  AvailabilityStatus: string;
  License: string;
  Password?: string;
  ContactDetails: string;
}

// Define a type for the form data, with Password being optional for updates
interface DriverFormData {
  Name: string;
  Surname: string;
  Email: string;
  License: string;
  Password?: string;
  ContactDetails: string;
  AvailabilityStatus: string;
}

export function ManageDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<DriverFormData>({
    Name: "",
    Surname: "",
    Email: "",
    License: "",
    Password: "",
    ContactDetails: "",
    AvailabilityStatus: "Available",
  });

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof Driver; direction: 'ascending' | 'descending' } | null>(null);

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/drivers");
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error("[v0] Error fetching drivers:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    let searchableDrivers = drivers.filter(
      (driver) =>
        driver.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.Surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.License.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.ContactDetails.includes(searchTerm),
    );

    if (sortConfig !== null) {
      searchableDrivers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return searchableDrivers;
  }, [drivers, searchTerm, sortConfig]);

  const handleAddDriver = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newDriver = await response.json();
        setDrivers([...drivers, newDriver]);
        setFormData({ Name: "", Surname: "", Email: "", License: "", Password: "", ContactDetails: "", AvailabilityStatus: "Available" });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("[v0] Error adding driver:", error);
    }
    setIsLoading(false);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      Name: driver.Name,
      Surname: driver.Surname,
      Email: driver.Email,
      License: driver.License,
      Password: "",
      ContactDetails: driver.ContactDetails,
      AvailabilityStatus: driver.AvailabilityStatus,
    });
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    setIsLoading(true);
    try {
      const updatedData = { ...formData };
      if (updatedData.Password === "") {
        delete updatedData.Password;
      }

      const response = await fetch(`/api/drivers/${editingDriver.Driver_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedDriver = await response.json();
        setDrivers(drivers.map((d) => (d.Driver_ID === editingDriver.Driver_ID ? updatedDriver : d)));
        setEditingDriver(null);
        setFormData({ Name: "", Surname: "", Email: "", License: "", Password: "", ContactDetails: "", AvailabilityStatus: "Available" });
      }
    } catch (error) {
      console.error("[v0] Error updating driver:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteDriver = async (id: number) => {
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDrivers(drivers.filter((d) => d.Driver_ID !== id));
      } else {
        console.error("[v0] Failed to delete driver");
      }
    } catch (error) {
      console.error("[v0] Error deleting driver:", error);
    }
  };

  const toggleDriverAvailability = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Available" ? "Unavailable" : "Available";
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ AvailabilityStatus: newStatus }),
      });

      if (response.ok) {
        const updatedDriver = await response.json();
        setDrivers(drivers.map((d) => (d.Driver_ID === id ? updatedDriver : d)));
      }
    } catch (error) {
      console.error("[v0] Error updating driver availability:", error);
    }
  };

  const updateFormData = (field: keyof DriverFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const availableDrivers = drivers.filter((d) => d.AvailabilityStatus === "Available").length;

  const handleSort = (key: keyof Driver) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Driver) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Manage Drivers</h1>
          <p className="text-muted-foreground">Add, edit, and manage driver profiles and availability</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>Enter the driver's information to create a new profile.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) => updateFormData("Name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
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
                  value={formData.Email}
                  onChange={(e) => updateFormData("Email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">Driver's License</Label>
                <Input
                  id="license"
                  value={formData.License}
                  onChange={(e) => updateFormData("License", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.Password}
                  onChange={(e) => updateFormData("Password", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_details">Contact Number</Label>
                <Input
                  id="contact_details"
                  value={formData.ContactDetails}
                  onChange={(e) => updateFormData("ContactDetails", e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="availability">Available for assignments</Label>
                <Switch
                  id="availability"
                  checked={formData.AvailabilityStatus === "Available"}
                  onCheckedChange={(checked) => updateFormData("AvailabilityStatus", checked ? "Available" : "Unavailable")}
                />
              </div>
              <Button onClick={handleAddDriver} className="w-full" disabled={isLoading}>
                {isLoading ? "Adding Driver..." : "Add Driver"}
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
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {availableDrivers} of {drivers.length} available
        </Badge>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Directory</CardTitle>
          <CardDescription>Complete list of registered drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('Name')}>
                  <div className="flex items-center">
                    Driver Info {getSortIcon('Name')}
                  </div>
                </TableHead>
                <TableHead>License</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('AvailabilityStatus')}>
                  <div className="flex items-center">
                    Status {getSortIcon('AvailabilityStatus')}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.Driver_ID}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {driver.Name} {driver.Surname}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{driver.License}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{driver.ContactDetails}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={driver.AvailabilityStatus === "Available"}
                        onCheckedChange={() => toggleDriverAvailability(driver.Driver_ID, driver.AvailabilityStatus)}
                        className="h-4 w-8"
                      />
                      <Badge variant={driver.AvailabilityStatus === "Available" ? "default" : "secondary"}>
                        {driver.AvailabilityStatus}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditDriver(driver)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteDriver(driver.Driver_ID)}>
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
      <Dialog open={!!editingDriver} onOpenChange={() => setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update the driver's information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">First Name</Label>
                <Input
                  id="edit-name"
                  value={formData.Name}
                  onChange={(e) => updateFormData("Name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-surname">Last Name</Label>
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
              <Label htmlFor="edit-license">Driver's License</Label>
              <Input
                id="edit-license"
                value={formData.License}
                onChange={(e) => updateFormData("License", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.Password}
                onChange={(e) => updateFormData("Password", e.target.value)}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-availability">Available for assignments</Label>
              <Switch
                id="edit-availability"
                checked={formData.AvailabilityStatus === "Available"}
                onCheckedChange={(checked) => updateFormData("AvailabilityStatus", checked ? "Available" : "Unavailable")}
              />
            </div>
            <Button onClick={handleUpdateDriver} className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Driver..." : "Update Driver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}