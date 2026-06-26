import { createBrowserRouter, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { AppLayout } from "@/shared/layout/AppLayout"
import { OrganizationsPage } from "@/features/organization/pages/OrganizationsPage"
import { OrgDetailPage } from "@/features/organization/pages/OrgDetailPage"
import { BoardPage } from "@/features/board/pages/BoardPage"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/auth/callback", element: <OAuthCallbackPage /> },

  // กลุ่ม route ที่ต้อง login — ห่อด้วย AppLayout (header + outlet)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <OrganizationsPage /> },
          { path: "/org/:orgId", element: <OrgDetailPage /> },
          { path: "/org/:orgId/board/:boardId", element: <BoardPage /> },
        ],
      },
    ],
  },

  // ที่เหลือ → กลับหน้าแรก
  { path: "*", element: <Navigate to="/" replace /> },
])
