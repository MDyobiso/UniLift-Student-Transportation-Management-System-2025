"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, Download, TrendingUp, Users, Car, Clock, FileText, MapPin } from "lucide-react"

// Define the data types for the fetched data
interface ReportsData {
  peakHours: { hour: number; volume: number }[]
  popularRoutes: { PickupLocation: string; Destination: string; volume: number }[]
  monthlyTrends: { month: string; rides: number; students: number }[]
  driverPerformance: { Driver_ID: number; Name: string; Surname: string; totalRides: number }[]
  vehicleStatus: { status: string; count: number }[]
}

export function AdminReports() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch('/api/reports')
        if (!response.ok) {
          throw new Error('Failed to fetch reports data.')
        }
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReportsData()
  }, [])

  const handleExportReport = async (reportType: string) => {
    try {
      // Dynamic imports for client-side libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const reportsContainer = document.getElementById('reports-container');
      if (!reportsContainer) {
        console.error('Reports container element not found.');
        return;
      }

      const canvas = await html2canvas(reportsContainer);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Use the image's original aspect ratio by setting height to 0
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, 0);
      
      pdf.save(`unilift-${reportType}-report.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading reports data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: {error}</p>
        <p>Please check your database connection and table schemas.</p>
      </div>
    )
  }

  const statusColors: { [key: string]: string } = {
    'Available': '#82ca9d',
    'Active': '#8884d8',
    'Maintenance': '#ffc658',
  };

  const formattedPopularRoutes = data?.popularRoutes.map(route => ({
    name: `${route.PickupLocation} → ${route.Destination}`,
    volume: route.volume
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Admin Reports</h2>
      </div>

      {/* Export Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" /> Export Reports
          </CardTitle>
          <CardDescription>Generate comprehensive reports for different time periods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportReport("daily")}
              className="h-20 flex-col gap-2 bg-transparent"
            >
              <Calendar className="h-6 w-6" />
              Daily Report
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("weekly")}
              className="h-20 flex-col gap-2 bg-transparent"
            >
              <Calendar className="h-6 w-6" />
              Weekly Report
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("monthly")}
              className="h-20 flex-col gap-2 bg-transparent"
            >
              <Calendar className="h-6 w-6" />
              Monthly Report
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("custom")}
              className="h-20 flex-col gap-2 bg-transparent"
            >
              <FileText className="h-6 w-6" />
              Custom Report
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div id="reports-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Monthly Ride Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Monthly Ride Trends
            </CardTitle>
            <CardDescription>Rides and students served per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rides" fill="#8884d8" name="Rides" />
                <Bar dataKey="students" fill="#82ca9d" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Peak Hours Analysis
            </CardTitle>
            <CardDescription>Request volume by hour of the day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" /> Vehicle Status Distribution
            </CardTitle>
            <CardDescription>Distribution of vehicles by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.vehicleStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data?.vehicleStatus.map((entry) => (
                    <Cell key={`cell-${entry.status}`} fill={statusColors[entry.status] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4">
              {data?.vehicleStatus.map((entry) => (
                <div key={entry.status} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[entry.status] || '#ccc' }}></span>
                  <span>{entry.status} ({entry.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Popular Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Most Popular Routes
            </CardTitle>
            <CardDescription>Top 5 most requested routes by volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={formattedPopularRoutes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="volume" fill="#8884d8" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Driver Performance
            </CardTitle>
            <CardDescription>Total rides completed by each driver.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Rides
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {data?.driverPerformance.map((driver) => (
                    <tr key={driver.Driver_ID}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {driver.Name} {driver.Surname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {driver.totalRides}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
