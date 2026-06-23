import { createBrowserRouter, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { DashboardPage } from "@/features/dashboard/DashboardPage"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/auth/callback", element: <OAuthCallbackPage /> },

  // กลุ่ม route ที่ต้อง login
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <DashboardPage /> }],
  },

  // ที่เหลือ → กลับหน้าแรก
  { path: "*", element: <Navigate to="/" replace /> },
])
