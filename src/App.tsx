import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { AxiosError } from "axios"
import { Toaster, toast } from "sonner"
import { AuthProvider } from "@/features/auth/AuthContext"
import { getApiErrorMessage } from "@/shared/api/errors"
import { router } from "@/app/router"

// QueryClient ตัวเดียวทั้งแอป — จัดการ cache/refetch ของ server state
//
// ค่า default ของ TanStack Query "ขยายจำนวน request" หลายเท่า ซึ่งทำให้ชน
// rate limiter (100 req/15min) ได้ง่ายมาก → เราจูนให้เบาลง:
//   - staleTime  : ถือว่า data ยัง "สด" 60 วิ → เปลี่ยนหน้าไปมาในช่วงนี้ใช้ cache ไม่ refetch
//   - refetchOnWindowFocus: false → สลับแท็บแล้วกลับมา ไม่ refetch ทุก query ใหม่หมด
//   - retry      : อย่ายิงซ้ำพวก 4xx (401/403/429) — ยิงซ้ำก็ผลเหมือนเดิม แถมยิ่งถม rate limit
const queryClient = new QueryClient({
  // Global error toast: mutation ไหนพังแล้วไม่มีใครแสดงผล → เด้ง toast ให้เสมอ
  // (ก่อนหน้านี้ เช่น "ลากการ์ดแล้ว server ปฏิเสธ" คือเงียบสนิท ผู้ใช้ไม่รู้ตัว)
  // mutation ที่มี error UI ของตัวเองอยู่แล้ว ประกาศ meta.silent = true เพื่อไม่ให้ซ้ำ
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return
      toast.error(getApiErrorMessage(error))
    },
  }),
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
        {/* toast ทั้งแอป render ที่นี่ — richColors ให้ error แดง/success เขียว */}
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
