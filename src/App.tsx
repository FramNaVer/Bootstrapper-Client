import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { AxiosError } from "axios"
import { AuthProvider } from "@/features/auth/AuthContext"
import { router } from "@/app/router"

// QueryClient ตัวเดียวทั้งแอป — จัดการ cache/refetch ของ server state
//
// ค่า default ของ TanStack Query "ขยายจำนวน request" หลายเท่า ซึ่งทำให้ชน
// rate limiter (100 req/15min) ได้ง่ายมาก → เราจูนให้เบาลง:
//   - staleTime  : ถือว่า data ยัง "สด" 60 วิ → เปลี่ยนหน้าไปมาในช่วงนี้ใช้ cache ไม่ refetch
//   - refetchOnWindowFocus: false → สลับแท็บแล้วกลับมา ไม่ refetch ทุก query ใหม่หมด
//   - retry      : อย่ายิงซ้ำพวก 4xx (401/403/429) — ยิงซ้ำก็ผลเหมือนเดิม แถมยิ่งถม rate limit
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
