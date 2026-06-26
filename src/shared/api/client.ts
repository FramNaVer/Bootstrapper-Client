// =============================================================
// API Client (axios) — แนบ token อัตโนมัติ + refresh เมื่อ 401
// =============================================================
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"
import { tokenStorage } from "./tokenStorage"

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`

export const api = axios.create({ baseURL: BASE_URL })

// --- Request: แนบ access token ทุก request ที่มี token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// --- Response: 401 → ลอง refresh ครั้งเดียว แล้ว retry ---
//
// "single-flight": ถ้ามีหลาย request เด้ง 401 พร้อมกัน เราขอ refresh แค่ "ครั้งเดียว"
// request อื่นๆ รอ token ใหม่จากรอบนั้น (กันยิง /refresh ซ้ำหลายรอบ → refresh rotation พัง)
let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh()
  if (!refreshToken) throw new Error("No refresh token")

  // ใช้ axios เปล่า (ไม่ผ่าน interceptor) กัน loop
  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  const { accessToken, refreshToken: newRefresh } = res.data.data
  // backend หมุน refresh token ทุกครั้ง → ต้องเก็บตัวใหม่ด้วย
  tokenStorage.set(accessToken, newRefresh)
  return accessToken
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    // เด้ง 401 และยังไม่เคย retry → ลอง refresh
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        // ถ้ายังไม่มีรอบ refresh ที่กำลังทำอยู่ ให้เริ่มรอบใหม่
        refreshing = refreshing ?? refreshAccessToken()
        const newToken = await refreshing
        refreshing = null

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        refreshing = null
        // ล้าง session เฉพาะตอน refresh ถูก "ปฏิเสธจริง" (401/403 = token หมดอายุ/ถูก revoke)
        // ไม่ใช่ตอนโดน 429 (rate limit) หรือเน็ตหลุด — พวกนั้นเป็นปัญหาชั่วคราว
        // ถ้าล้าง token เพราะ 429 = ผู้ใช้โดนเด้งออกทั้งที่ session ยังดีอยู่
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
