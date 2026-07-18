"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Car, Clock, AlertTriangle, TrendingUp, MapPin, Calendar } from "lucide-react"

export function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch dashboard data. Server responded with non-JSON.' }))
          throw new Error(errorData.error || 'Failed to fetch dashboard data.')
        }
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const vehiclesInUse = data?.vehicleStatus.find((v: any) => v.status === 'in_use')?.count ?? 0;
  const availableVehicles = data?.vehicleStatus.find((v: any) => v.status === 'available')?.count ?? 0;
  const maintenanceVehicles = data?.vehicleStatus.find((v: any) => v.status === 'maintenance')?.count ?? 0;
  const vehicleChartData = [
    { name: 'Available', value: availableVehicles, color: '#4CAF50' },
    { name: 'In Use', value: vehiclesInUse, color: '#FFC107' },
    { name: 'Maintenance', value: maintenanceVehicles, color: '#F44336' },
  ]
  const COLORS = ['#4CAF50', '#FFC107', '#F44336'];


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-medium text-gray-500">Loading Dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 text-red-700 p-4 rounded-lg">
        <AlertTriangle className="h-10 w-10 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-center">{error}</p>
        <p className="text-center text-sm mt-2">Please check your database connection and server logs.</p>
      </div>
    )
  }

  return (

    <div className="container mx-auto p-6 space-y-8 bg-gray-50">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview and management of the Unilift system.</p>
      </div>

      {/* System Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents ?? 0}</div>
            <p className="text-xs text-gray-500">All registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Car className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDrivers ?? 0}</div>
            <p className="text-xs text-gray-500">Registered drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVehicles ?? 0}</div>
            <p className="text-xs text-gray-500">Vehicles on the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingRequests ?? 0}</div>
            <p className="text-xs text-gray-500">Unassigned ride requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedToday ?? 0}</div>
            <p className="text-xs text-gray-500">Rides completed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeRequests ?? 0}</div>
            <p className="text-xs text-gray-500">Requests currently in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status</CardTitle>
            <CardDescription>Current status of all registered vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vehicleChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {vehicleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Critical and important system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-3 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Pending Requests</p>
                <p className="text-sm text-red-700">There are {data.pendingRequests ?? 0} unassigned requests that need attention.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 border border-green-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Performance Update</p>
                <p className="text-sm text-green-700">System efficiency improved by 12% this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push('/admin/students')}>
              <Users className="h-6 w-6" />
              Manage Students
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push('/admin/drivers')}>
              <Car className="h-6 w-6" />
              Manage Drivers
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push('/admin/vehicles')}>
              <MapPin className="h-6 w-6" />
              Manage Vehicles
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push('/admin/requests')}>
              <Clock className="h-6 w-6" />
              View All Requests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}