import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { AuthProvider } from "@/features/auth/AuthContext"
import { router } from "@/app/router"

// QueryClient ตัวเดียวทั้งแอป — จัดการ cache/refetch ของ server state
const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
