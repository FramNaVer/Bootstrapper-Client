import { lazy, Suspense, type ReactNode } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { AppLayout } from "@/shared/layout/AppLayout"

// =============================================================
// Code splitting: โหลดโค้ดของแต่ละหน้า "เมื่อถูกเปิดจริง" เท่านั้น
// Vite เห็น import() แบบ dynamic → แยกไฟล์ (chunk) ต่อหน้าให้อัตโนมัติ
// ผล: bundle แรกเล็กลงมาก (ของหนักอย่าง dnd-kit ย้ายไปอยู่ chunk ของ BoardPage
// คนที่แค่มา login ไม่ต้องโหลดโค้ดลากการ์ดเลย)
// AppLayout/ProtectedRoute คง static — เป็นโครงที่ทุกหน้าใช้ แยกไปก็ต้องโหลดทันทีอยู่ดี
//
// .then((m) => ({ default: m.XxxPage })) เพราะ React.lazy ต้องการ default export
// แต่หน้าของเราใช้ named export — แปลงตรงนี้แทนการไล่แก้ทุกไฟล์
// =============================================================

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  }))
)
const RegisterPage = lazy(() =>
  import("@/features/auth/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  }))
)
const OAuthCallbackPage = lazy(() =>
  import("@/features/auth/pages/OAuthCallbackPage").then((m) => ({
    default: m.OAuthCallbackPage,
  }))
)
const AcceptInvitationPage = lazy(() =>
  import("@/features/auth/pages/AcceptInvitationPage").then((m) => ({
    default: m.AcceptInvitationPage,
  }))
)
const VerifyEmailPage = lazy(() =>
  import("@/features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  }))
)
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  }))
)
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  }))
)
const OrganizationsPage = lazy(() =>
  import("@/features/organization/pages/OrganizationsPage").then((m) => ({
    default: m.OrganizationsPage,
  }))
)
const OrgDetailPage = lazy(() =>
  import("@/features/organization/pages/OrgDetailPage").then((m) => ({
    default: m.OrgDetailPage,
  }))
)
const BoardPage = lazy(() =>
  import("@/features/board/pages/BoardPage").then((m) => ({
    default: m.BoardPage,
  }))
)

// จอระหว่างรอโหลด chunk — เห็นแว้บเดียวเฉพาะครั้งแรกที่เปิดหน้านั้น
// (ครั้งถัดไป chunk อยู่ใน cache ของเบราว์เซอร์แล้ว)
function PageLoader() {
  return (
    <div className="text-muted-foreground flex min-h-screen items-center justify-center">
      กำลังโหลด…
    </div>
  )
}

// ห่อ lazy page ด้วย Suspense — React จะโชว์ fallback จนกว่า chunk มาถึง
function page(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  { path: "/login", element: page(<LoginPage />) },
  { path: "/register", element: page(<RegisterPage />) },
  { path: "/auth/callback", element: page(<OAuthCallbackPage />) },
  // public: คนถูกเชิญเปิดลิงก์ — หน้านี้จัดการ login-redirect เอง (เก็บ token ไว้)
  { path: "/accept-invitation", element: page(<AcceptInvitationPage />) },
  // public: ปลายทางลิงก์ยืนยันอีเมล (ยังไม่ login ก็เปิดได้)
  { path: "/verify-email", element: page(<VerifyEmailPage />) },
  // public: ลืมรหัสผ่าน → ขอลิงก์ / ตั้งรหัสใหม่จากลิงก์ในเมล
  { path: "/forgot-password", element: page(<ForgotPasswordPage />) },
  { path: "/reset-password", element: page(<ResetPasswordPage />) },

  // กลุ่ม route ที่ต้อง login — ห่อด้วย AppLayout (header + outlet)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: page(<OrganizationsPage />) },
          { path: "/org/:orgId", element: page(<OrgDetailPage />) },
          { path: "/org/:orgId/board/:boardId", element: page(<BoardPage />) },
        ],
      },
    ],
  },

  // ที่เหลือ → กลับหน้าแรก
  { path: "*", element: <Navigate to="/" replace /> },
])
