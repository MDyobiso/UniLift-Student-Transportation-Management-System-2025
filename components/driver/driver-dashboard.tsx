// app/driver-dashboard/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Clock, MapPin, Car, User, Calendar, CheckCircle, Navigation, Bell, RefreshCcw, X } from "lucide-react"
import { AuthService } from "@/lib/auth"
import type { Request } from "@/lib/types"
import { useNotifications } from "@/components/ui/notification-provider"
import { realtimeService } from "@/lib/realtime"
import { toast } from 'react-hot-toast';

type Driver = {
  id: number;
  name?: string;
  surname?: string;
  contact_details?: string;
  email?: string;
  driver_id: number;
}

type Vehicle = {
  Vehicle_ID: number;
  Model: string;
  Plate_Number: string;
  Capacity: number;
  Driver_ID: number;
}

export function DriverDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [user, setUser] = useState<Driver | null>(null);
  const { addNotification } = useNotifications()

  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [todaysSummary, setTodaysSummary] = useState({
    totalRides: 0,
    totalEarnings: 0
  });

  const [pendingNotifications, setPendingNotifications] = useState<Request[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const hasNotifiedPendingRef = useRef(false);
  const notificationRef = useRef<HTMLDivElement>(null); // Ref for the notification container

  // ----------------- Fetch Driver Data -----------------
  const fetchDriverData = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || typeof currentUser.driver_id !== "number") {
      setIsLoading(false);
      return;
    }

    setUser(currentUser);
    setIsLoading(true);

    try {
      const [requestsResponse, vehicleResponse, summaryResponse] = await Promise.all([
        fetch(`/api/requests?driverId=${currentUser.driver_id}`),
        fetch(`/api/vehicles?driverId=${currentUser.driver_id}`),
        fetch(`/api/driver-summary/today?driverId=${currentUser.driver_id}`)
      ]);

      // --- Requests ---
      if (requestsResponse.ok) {
        const data: Request[] = await requestsResponse.json();
        setRequests(data);

        const pendingRequests = data.filter(r => r.status === "Pending");
        setPendingNotifications(pendingRequests);

        if (pendingRequests.length > 0 && !hasNotifiedPendingRef.current) {
          const firstPending = pendingRequests[0];
          addNotification({
            title: "New Ride Request",
            message: `Ride #${firstPending.id} is pending. Pickup at ${firstPending.pickup_location}`,
            type: "info",
          });
          hasNotifiedPendingRef.current = true;
        }
      } else {
        console.error("Failed to fetch driver requests:", requestsResponse.statusText);
        toast.error("Failed to load your ride requests.");
      }

      // --- Vehicle ---
      if (vehicleResponse.ok) {
        const vehicleData = await vehicleResponse.json();
        setVehicle(vehicleData.length > 0 ? vehicleData[0] : null);
      } else {
        console.error("Failed to fetch vehicle data:", vehicleResponse.statusText);
        toast.error("Failed to load vehicle information.");
      }

      // --- Today's Summary ---
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setTodaysSummary(summaryData);
      } else {
        console.error("Failed to fetch summary data:", summaryResponse.statusText);
        toast.error("Failed to load today's summary.");
      }

      console.log("[v1] Fetched driver data successfully.");
    } catch (error) {
      console.error("[v1] Error fetching driver data:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------- useEffect for Real-time Notifications and Click-outside -----------------
  useEffect(() => {
    fetchDriverData();

    // Listener for new 'pending' requests
    const unsubscribeNewRequests = realtimeService.subscribe("new-requests", (newRequest) => {
      if (isAvailable) {
        addNotification({
          title: "New Ride Request",
          message: `New ride request at ${newRequest.pickup_location}`,
          type: "info",
        });
        fetchDriverData(); // Refresh data to show the new request
      }
    });

    // Listener for 'assigned' requests
    const unsubscribeAssignments = realtimeService.subscribe("request-assigned", (assignment) => {
      if (assignment.driverId === user?.driver_id) {
        addNotification({
          title: "New Assignment",
          message: `You've been assigned to a ride request`,
          type: "success",
        });
        fetchDriverData();
      }
    });

    // Handle click outside notification bar to close it
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      unsubscribeNewRequests();
      unsubscribeAssignments();
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isAvailable, addNotification, user?.driver_id]);

  // ----------------- Status / Availability -----------------
  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRequests(prev =>
          prev.map(req => req.id === requestId ? { ...req, status: newStatus as any } : req)
        );
        toast.success(`Ride status updated to ${newStatus.replace("_", " ")}.`);
        if (newStatus === "Completed") fetchDriverData();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update status: ${errorData.error}`);
      }
    } catch (error) {
      toast.error("Network error. Could not update ride status.");
    }
  };

  const handleAvailabilityToggle = async (available: boolean) => {
    if (!user || typeof user.driver_id !== 'number') return;

    const newStatus = available ? 'Available' : 'Not Available';

    try {
      const response = await fetch(`/api/drivers/${user.driver_id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setIsAvailable(available);
        addNotification({
          title: "Availability Updated",
          message: `You are now ${available ? "available" : "offline"} for new rides`,
          type: available ? "success" : "info",
        });
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update availability: ${errorData.error}`);
      }
    } catch (error) {
      toast.error("Network error. Could not update your status.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "In_progress": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => status?.replace(/_/g, ' ') || 'Unknown';

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString("en-ZA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const activeRequests = requests.filter(r => ["Assigned", "In_progress", "Pending"].includes(r.status));

  // ----------------- JSX -----------------
  return (
    <div className="space-y-6 relative">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-2">
                  Welcome, {user?.name} {user?.surname}!
                </h1>
                <p className="text-muted-foreground">Manage your assigned rides and track your performance.</p>
              </div>
              <div className="flex items-center space-x-3 relative">
                <div className="relative">
                  <Bell className="h-4 w-4 text-primary cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
                  {pendingNotifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {pendingNotifications.length}
                    </span>
                  )}
                </div>
                {showNotifications && (
                  <div ref={notificationRef} className="absolute top-8 right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">New Requests</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-800"  aria-label="Close notifications"> 
                        <X size={16} />
                      </button>
                    </div>
                    {pendingNotifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No new notifications</div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        {pendingNotifications.map(req => (
                          <div key={req.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <p className="font-medium">Ride #{req.id}</p>
                            <p className="text-xs text-gray-600">Pickup: {req.pickup_location}</p>
                            <p className="text-xs text-gray-600">Time: {formatDateTime(req.pickup_time)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className="text-sm font-medium">Available</span>
                <Switch checked={isAvailable} onCheckedChange={handleAvailabilityToggle} />
                <Badge variant={isAvailable ? "default" : "secondary"}>{isAvailable ? "Online" : "Offline"}</Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Active Rides</p>
                    <p className="text-2xl font-bold text-primary">{activeRequests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">{todaysSummary.totalRides}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">Vehicle</p>
                    {vehicle ? (
                      <p className="text-lg font-semibold text-secondary">
                        {vehicle.Model} ({vehicle.Plate_Number})
                      </p>
                    ) : (
                      <p className="text-lg font-semibold text-secondary">No vehicle assigned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Active Rides
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No active rides.{" "}
                    {isAvailable ? "Waiting for new assignments..." : "Set yourself as available to receive rides."}
                  </p>
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-4">
                  {activeRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(request.status)}>{formatStatus(request.status)}</Badge>
                        <span className="text-sm text-muted-foreground">Ride #{request.id}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="font-medium mb-2">Student Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {request.student?.name} {request.student?.surname}
                          </div>
                          <div>
                            <span className="font-medium">Student #:</span> {request.student?.student_number}
                          </div>
                          <div>
                            <span className="font-medium">Contact:</span> {request.student?.contact_details}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">Pickup:</span>
                            <span className="text-muted-foreground">{request.pickup_location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-secondary" />
                            <span className="font-medium">Destination:</span>
                            <span className="text-muted-foreground">{request.destination}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span className="font-medium">Pickup Time:</span>
                            <span className="text-muted-foreground">{formatDateTime(request.pickup_time)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {request.status === "Pending" && (
                          <Button onClick={() => handleStatusUpdate(request.id, "Assigned")} className="flex-1">
                            Accept Ride
                          </Button>
                        )}
                        {request.status === "Assigned" && (
                          <Button onClick={() => handleStatusUpdate(request.id, "In_progress")} className="flex-1">
                            Start Ride
                          </Button>
                        )}
                        {request.status === "In_progress" && (
                          <Button onClick={() => handleStatusUpdate(request.id, "Completed")} className="flex-1">
                            Complete Ride
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>Your performance metrics for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{todaysSummary.totalRides}</div>
                  <div className="text-sm text-muted-foreground">Total Rides</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">R {todaysSummary.totalEarnings}</div>
                  <div className="text-sm text-muted-foreground">Earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}