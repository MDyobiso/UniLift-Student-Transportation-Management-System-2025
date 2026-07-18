// StudentDashboard.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Car, User, Calendar, Bell, RefreshCcw, Star } from "lucide-react"
import { AuthService } from "@/lib/auth"
import type { Request } from "@/lib/types"
import { useNotifications } from "@/components/ui/notification-provider"
import { realtimeService } from "@/lib/realtime"

export function StudentDashboard() {
    const [requests, setRequests] = useState<Request[]>([])
    const [user, setUser] = useState(AuthService.getCurrentUser())
    const [editingRequest, setEditingRequest] = useState<number | null>(null)
    const [editForm, setEditForm] = useState({
        pickup_time: "",
        pickup_location: "",
        destination: "",
        notes: "",
    })
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification, notifications } = useNotifications()

    const [stats, setStats] = useState({
        totalRides: 0,
        activeRequests: 0,
        averageRating: 0
    });

    const [hoverRating, setHoverRating] = useState<{ [key: number]: number | null }>({});
    
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const destinations = ["Campus", "Residence"];

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser || !currentUser.stud_id) {
            console.error("User not authenticated.");
            setIsLoading(false);
            return;
        }

        try {
            // Update to use the new API endpoint with a query parameter
            const response = await fetch(`/api/student-dashboard?studentId=${currentUser.stud_id}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests);
                setStats(data.stats);
                // Set the user state with the profile data returned by the API
                setUser({
                  ...AuthService.getCurrentUser(),
                  studentNo: data.profile.StudentNo,
                  name: data.profile.Name,
                  surname: data.profile.Surname,
                  contact_details: data.profile.ContactDetails,
                  availabilityStatus: AuthService.getCurrentUser()?.availabilityStatus || "", // default string
                  availability_status: AuthService.getCurrentUser()?.availability_status ?? false, // default boolean
                  driver_id: AuthService.getCurrentUser()?.driver_id || null,
                  id: AuthService.getCurrentUser()?.id || 0,
                  role: AuthService.getCurrentUser()?.role || "student",
                });
                
            } else {
                console.error("Error fetching dashboard data:", await response.json());
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData()

        const unsubscribe = realtimeService.subscribe("ride-updates", async (update) => {
            try {
                const res = await fetch(`/api/requests/${update.rideId}`);
                if (!res.ok) return;
                const ride = await res.json();
            
                if (ride.Notified || ride.RequestStatus.toLowerCase() !== update.status) return;
            
                let title = "";
                let message = "";
                let type: "info" | "success" | "warning" | "error" = "info";
            
                switch (update.status) {
                    case "assigned":
                        title = "Driver Assigned";
                        message = `A driver has been assigned to your request #${update.rideId}.`;
                        type = "success";
                        break;
                    case "in_progress":
                        title = "Trip In Progress";
                        message = `Your trip for request #${update.rideId} is on its way!`;
                        type = "info";
                        break;
                    case "completed":
                        title = "Trip Completed";
                        message = `Your trip for request #${update.rideId} has been completed.`;
                        type = "success";
                        break;
                    case "cancelled":
                        title = "Request Cancelled";
                        message = `Request #${update.rideId} has been cancelled.`;
                        type = "warning";
                        break;
                    default:
                        return;
                }
            
                addNotification({ title, message, type });
                setUnreadCount(prev => prev + 1);
            
                await fetch(`/api/requests/${update.rideId}/notify`, { method: "PUT" });
            
                fetchDashboardData();
            } catch (err) {
                console.error("Error handling ride update notification:", err);
            }
        });    

        return unsubscribe
    }, [addNotification, fetchDashboardData])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "Assigned":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "In_progress":
                return "bg-purple-100 text-purple-800 border-purple-200"
            case "Completed":
                return "bg-green-100 text-green-800 border-green-200"
            case "Cancelled":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handleCancelRequest = async (requestId: number) => {
        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                addNotification({
                    title: "Request Cancelled",
                    message: `Request #${requestId} has been cancelled successfully`,
                    type: "success",
                })
            } else {
                const error = await response.json()
                addNotification({
                    title: "Cancellation Failed",
                    message: error.error || "Failed to cancel request",
                    type: "error",
                })
            }
            fetchDashboardData();
        } catch (error) {
            console.error("Error cancelling request:", error)
            addNotification({
                title: "Error",
                message: "An error occurred while cancelling the request",
                type: "error",
            })
        }
    }

    const handleEditRequest = (request: Request) => {
        setEditingRequest(request.id)
        setEditForm({
            pickup_time: request.pickup_time.slice(0, 16),
            pickup_location: request.pickup_location,
            destination: request.destination,
            notes: request.notes || "",
        })
    }

    const handleSaveEdit = async () => {
        if (!editingRequest) return

        try {
            const response = await fetch(`/api/requests/${editingRequest}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...editForm,
                    pickup_time: new Date(editForm.pickup_time).toISOString(),
                }),
            })

            if (response.ok) {
                setEditingRequest(null)
                addNotification({
                    title: "Request Updated",
                    message: "Your request has been updated successfully",
                    type: "success",
                })
            } else {
                const error = await response.json()
                addNotification({
                    title: "Update Failed",
                    message: error.error || "Failed to update request",
                    type: "error",
                })
            }
            fetchDashboardData();
        } catch (error) {
            console.error("Error updating request:", error)
            addNotification({
                title: "Error",
                message: "An error occurred while updating the request",
                type: "error",
            })
        }
    }

    const handleCancelEdit = () => {
        setEditingRequest(null)
        setEditForm({
            pickup_time: "",
            pickup_location: "",
            destination: "",
            notes: "",
        })
    }

    const handleRateRide = async (requestId: number, rate: number) => {
        const confirmation = window.confirm(`Are you sure you want to give a ${rate}-star rating?`);
        if (!confirmation) return;
    
        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rate }),
            });
    
            if (response.ok) {
                addNotification({
                    title: "Rating Submitted",
                    message: "Your rating has been saved successfully.",
                    type: "success",
                });
                fetchDashboardData();
            } else {
                const error = await response.json();
                addNotification({
                    title: "Rating Failed",
                    message: error.error || "Failed to submit rating.",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error submitting rating:", error);
            addNotification({
                title: "Error",
                message: "An error occurred while submitting the rating.",
                type: "error",
            });
        }
    };

    const activeRequests = requests.filter((r) => ["pending", "assigned", "in_progress"].includes(r.status.toLowerCase()))
    const completedRequests = requests.filter((r) => ["completed", "cancelled"].includes(r.status.toLowerCase()))

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-primary mb-2">
                            Welcome back, {user?.name} {user?.surname}!
                        </h1>
                        <p className="text-muted-foreground">Manage your transportation requests and track your rides.</p>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <div className="relative cursor-pointer" onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (showNotifications) {
                                setUnreadCount(0);
                            }
                        }}>
                            <Bell className="h-5 w-5 text-primary" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="py-1">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif, index) => (
                                            <div key={index} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b last:border-b-0">
                                                <p className="font-semibold">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="px-4 py-2 text-sm text-gray-500">No new notifications</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <Badge variant="secondary">Live Updates</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Active Requests</p>
                                <p className="text-2xl font-bold text-primary">{stats.activeRequests}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Car className="h-5 w-5 text-secondary" />
                            <div>
                                <p className="text-sm font-medium">Total Rides</p>
                                <p className="text-2xl font-bold text-secondary">{stats.totalRides}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-accent" />
                            <div>
                                <p className="text-sm font-medium">Student ID</p>
                                <p className="text-lg font-semibold text-accent">{user?.studentNo}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Active Requests
                    </CardTitle>
                    <CardDescription>Your current and upcoming transportation requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No active requests. Create a new request to get started!</p>
                        </div>
                    ) : (
                        <div className={`space-y-4 max-h-[170px] overflow-y-auto`}>
                            {activeRequests.map((request) => (
                                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                                        <span className="text-sm text-muted-foreground">#{request.id}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <span className="font-medium">From:</span>
                                                <span className="text-muted-foreground">{request.pickup_location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-secondary" />
                                                <span className="font-medium">To:</span>
                                                <span className="text-muted-foreground">{request.destination}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-accent" />
                                                <span className="font-medium">Pickup Time:</span>
                                                <span className="text-muted-foreground">{formatDateTime(request.pickup_time)}</span>
                                            </div>
                                            {request.driver ? (
                                                <>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">Driver:</span>
                                                    <span className="text-muted-foreground">
                                                        {request.driver.name} {request.driver.surname}
                                                    </span>
                                                </div>
                                                {request.driver.vehicle_details?.license_plate && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Car className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">Vehicle:</span>
                                                        <span className="text-muted-foreground">
                                                            {request.driver.vehicle_details.license_plate}
                                                        </span>
                                                    </div>
                                                )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">Driver:</span>
                                                    <span className="text-muted-foreground">Not yet assigned</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {(request.status.toLowerCase() === "pending" || request.status.toLowerCase() === "assigned") && (
                                            <>
                                                {editingRequest === request.id ? (
                                                    <div className="w-full space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label htmlFor="pickup_time" className="block text-sm font-medium text-gray-700">
                                                                    Pickup Time
                                                                </label>
                                                                <input
                                                                    id="pickup_time"
                                                                    type="datetime-local"
                                                                    value={editForm.pickup_time}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, pickup_time: e.target.value })
                                                                    }
                                                                    className="w-full p-2 border rounded-md text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label
                                                                    htmlFor="pickup_location"
                                                                    className="block text-sm font-medium text-gray-700"
                                                                >
                                                                    Pickup Location
                                                                </label>
                                                                <input
                                                                    id="pickup_location"
                                                                    type="text"
                                                                    value={editForm.pickup_location}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, pickup_location: e.target.value })
                                                                    }
                                                                    className="w-full p-2 border rounded-md text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                                                                    Destination
                                                                </label>
                                                                <select
                                                                    id="destination"
                                                                    value={editForm.destination}
                                                                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                                                                    className="w-full p-2 border rounded-md text-sm"
                                                                >
                                                                    {destinations.map((option) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-sm font-medium">Notes</label>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.notes}
                                                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                                    placeholder="Optional notes"
                                                                    className="w-full p-2 border rounded-md text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" onClick={handleSaveEdit}>
                                                                Save Changes
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                                                Cancel Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => handleEditRequest(request)}>
                                                        Edit Request
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="sm" onClick={() => handleCancelRequest(request.id)}>
                                                    Cancel Request
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent History</CardTitle>
                    <CardDescription>Your completed and cancelled requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {completedRequests.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            <p>No completed requests yet.</p>
                        </div>
                    ) : (
                        <div className={`space-y-3 max-h-[170px] overflow-y-auto`}>
                            {completedRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(request.status)} variant="outline">
                                                {request.status.toLowerCase()}
                                            </Badge>
                                            <span className="text-sm font-medium">#{request.id}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDateTime(request.updated_at || request.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {request.pickup_location} → {request.destination}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Scheduled: {formatDateTime(request.pickup_time)}</p>
                                    </div>
                                    {request.status.toLowerCase() === "completed" && (
                                        <div className="flex items-center gap-1">
                                            {request.rating !== null && request.rating !== undefined ? (
                                                <Badge variant="outline" className="text-sm font-normal cursor-default">
                                                    Rated: {request.rating}
                                                    <Star className="inline-block h-3 w-3 ml-1 fill-yellow-500 text-yellow-500" />
                                                </Badge>
                                            ) : (
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-5 w-5 cursor-pointer transition-colors ${
                                                                (hoverRating[request.id] || 0) >= star
                                                                    ? "text-yellow-500 fill-current"
                                                                    : "text-gray-400"
                                                            }`}
                                                            onMouseEnter={() => setHoverRating({ ...hoverRating, [request.id]: star })}
                                                            onMouseLeave={() => setHoverRating({ ...hoverRating, [request.id]: null })}
                                                            onClick={() => handleRateRide(request.id, star)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}