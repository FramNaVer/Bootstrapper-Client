// =============================================================
// API Client (axios) — แนบ access token อัตโนมัติ + refresh เมื่อ 401
// =============================================================
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"
import { tokenStorage, takeLegacyRefreshToken } from "./tokenStorage"

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`

// withCredentials: ให้เบราว์เซอร์แนบ/รับ cookie ข้าม origin (refresh token
// เป็น httpOnly cookie ของฝั่ง API) — cookie ถูกจำกัด Path=/api/v1/auth
// จึงติดไปเฉพาะ request ของ auth ไม่ใช่ทุก request
export const api = axios.create({ baseURL: BASE_URL, withCredentials: true })

// --- Request: แนบ access token ทุก request ที่มี token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// --- Refresh ---
// ปกติไม่ต้องส่งอะไร (เบราว์เซอร์แนบ cookie ให้เอง) — ยกเว้นครั้งแรกหลังอัปเดต:
// ผู้ใช้เดิมอาจมี refresh token ยุค localStorage ค้างอยู่ → ส่งใน body หนึ่งครั้ง
// backend จะตอบพร้อมฝัง cookie ให้ จากนั้นเข้าสู่ระบบ cookie ถาวร (ไม่โดนเด้งออก)
async function refreshAccessToken(): Promise<string> {
  const legacy = takeLegacyRefreshToken()
  // ใช้ axios เปล่า (ไม่ผ่าน interceptor) กัน loop
  const res = await axios.post(
    `${BASE_URL}/auth/refresh`,
    legacy ? { refreshToken: legacy } : {},
    { withCredentials: true }
  )
  const { accessToken } = res.data.data
  tokenStorage.setAccess(accessToken)
  return accessToken
}

// กันหลาย "แท็บ" refresh พร้อมกัน: rotation ทำให้ token เก่าตายทันทีที่หมุน
// สองแท็บยิงพร้อมกันด้วย cookie ใบเดียว = ตัวที่แพ้ถูกมองเป็น "token ถูกขโมย"
// → backend revoke ทุก session ของ user (โดนเด้งออกทุกแท็บ)
//
// Web Locks API คือ mutex ข้ามแท็บของ origin เดียวกัน: แท็บต่อคิวกัน
// ตัวที่มาทีหลังจะยิงด้วย cookie "ใบล่าสุด" ที่ตัวก่อนหน้าเพิ่งได้
// (cookie แชร์กันทุกแท็บอยู่แล้ว) → ไม่มีทางชนกันอีก
export async function refreshSession(): Promise<string> {
  if (!navigator.locks) return refreshAccessToken() // เบราว์เซอร์เก่ามาก: เสี่ยงแบบเดิม
  let token = ""
  await navigator.locks.request("auth-refresh", async () => {
    token = await refreshAccessToken()
  })
  return token
}

// --- Response: 401 → ลอง refresh ครั้งเดียว แล้ว retry ---
//
// "single-flight": ถ้ามีหลาย request เด้ง 401 พร้อมกัน (ในแท็บเดียว)
// เราขอ refresh แค่ครั้งเดียว request อื่นรอ token จากรอบนั้น
let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    // เด้ง 401 และยังไม่เคย retry → ลอง refresh
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        refreshing = refreshing ?? refreshSession()
        const newToken = await refreshing
        refreshing = null

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        refreshing = null
        // ล้าง session เฉพาะตอน refresh ถูก "ปฏิเสธจริง" (401/403 = หมดอายุ/ถูก revoke)
        // ไม่ใช่ตอนโดน 429 (rate limit) หรือเน็ตหลุด — พวกนั้นเป็นปัญหาชั่วคราว
        const status = (refreshError as AxiosError)?.response?.status
        if (status === 401 || status === 403) {
          tokenStorage.clear()
          if (window.location.pathname !== "/login") {
            window.location.href = "/login"
          }
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
