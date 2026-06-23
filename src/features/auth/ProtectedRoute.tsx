import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./AuthContext"

// ป้องกัน route ที่ต้อง login: ยังโหลดอยู่ → รอ, ไม่ login → เด้งไป /login
export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === "loading") {
    return <div className="center-screen">Loading…</div>
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
