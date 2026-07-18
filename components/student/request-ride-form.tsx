// /components/request-ride-form.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, ArrowRightLeft } from "lucide-react"
import { AuthService, AuthUser } from "@/lib/auth"

export function RequestRideForm() {
  const [formData, setFormData] = useState({
    pickup_location: "",
    route_type: "to_campus",
    pickup_date: "",
    pickup_time: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const router = useRouter()

  // Load the user from localStorage after hydration
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setLoadingUser(false)
  }, [])

  // Redirect if not student
  useEffect(() => {
    if (!loadingUser && (!user || user.role !== "student")) {
      router.push("/login")
    }
  }, [user, loadingUser, router])

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const student_id = user?.stud_id || user?.id

    if (!student_id) {
      setError("User not authenticated. Please log in again.")
      setIsLoading(false)
      return
    }

    if (!formData.pickup_location || !formData.pickup_date || !formData.pickup_time) {
      setError("Please fill in all required fields.")
      setIsLoading(false)
      return
    }

    const combinedPickupTime = `${formData.pickup_date} ${formData.pickup_time}:00`
    const destination = formData.route_type === "to_campus" ? "Campus" : "Residence"

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id,
          pickup_location: formData.pickup_location,
          pickup_time: combinedPickupTime,
          destination,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit request")
      }

      const result = await response.json()
      setSuccess(result.message)

      setFormData({
        pickup_location: "",
        route_type: "to_campus",
        pickup_date: "",
        pickup_time: "",
        notes: "",
      })
    } catch (apiError: any) {
      setError(apiError.message)
      console.error("API Error:", apiError)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingUser) {
    return <div>Loading...</div>
  }

  if (!user || user.role !== "student") {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a Ride</CardTitle>
        <CardDescription>
          Fill out the details below to request a ride from a driver.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-500/10 border-green-500/30 text-green-600"
            >
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Route Type */}
          <div className="space-y-2">
            <Label htmlFor="route_type">Route</Label>
            <Select
              value={formData.route_type}
              onValueChange={(value: "to_campus" | "from_campus") =>
                updateFormData("route_type", value)
              }
            >
              <SelectTrigger className="w-full">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_campus">Residence → Campus</SelectItem>
                <SelectItem value="from_campus">Campus → Residence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="pickup_location"
                placeholder="e.g., Student Village, NWU"
                value={formData.pickup_location}
                onChange={(e) => updateFormData("pickup_location", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_date">Pickup Date</Label>
              <Input
                id="pickup_date"
                type="date"
                value={formData.pickup_date}
                onChange={(e) => updateFormData("pickup_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup_time">Pickup Time</Label>
              <Input
                id="pickup_time"
                type="time"
                value={formData.pickup_time}
                onChange={(e) => updateFormData("pickup_time", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or additional information..."
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting Request..." : "Submit Ride Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
