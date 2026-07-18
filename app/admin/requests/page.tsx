import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ManageRequests } from "@/components/admin/manage-requests"

export default function AdminRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout activeTab="requests">
        <ManageRequests />
      </AdminLayout>
    </ProtectedRoute>
  )
}