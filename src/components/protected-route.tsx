import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { LoaderCircle } from "lucide-react"

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
