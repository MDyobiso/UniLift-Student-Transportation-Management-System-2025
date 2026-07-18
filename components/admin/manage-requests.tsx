"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Clock, CheckCircle2, XCircle } from "lucide-react"

// Define the type for a request based on the database schema
interface Request {
  Request_ID: number
  Stud_ID: number
  PickupLocation: string
  Destination: string
  RequestStatus: 'pending' | 'completed' | 'cancelled'
  pickup_time: string
  notes: string
}

export function ManageRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/admin-requests')
        if (!response.ok) {
          throw new Error('Failed to fetch requests')
        }
        const data = await response.json()
        setRequests(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRequests()
  }, [])

  const filteredRequests = requests.filter((request) =>
    request.Request_ID.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.PickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.Destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.RequestStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.notes.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500 mr-2" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500 mr-2" />
      default:
        return null
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">View All Requests</h2>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search requests..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests List</CardTitle>
          <CardDescription>A complete list of all ride requests, including active and completed rides.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Error: {error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.Request_ID}>
                      <TableCell>{request.Request_ID}</TableCell>
                      <TableCell>{request.Stud_ID}</TableCell>
                      <TableCell>{request.PickupLocation}</TableCell>
                      <TableCell>{request.Destination}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.RequestStatus)} className="flex items-center gap-1">
                          {getStatusIcon(request.RequestStatus)}
                          {request.RequestStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.pickup_time).toLocaleString()}</TableCell>
                      <TableCell>{request.notes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}