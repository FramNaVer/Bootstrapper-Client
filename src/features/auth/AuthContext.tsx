import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { tokenStorage } from "@/shared/api/tokenStorage"
import { refreshSession } from "@/shared/api/client"
import { authApi } from "./api/auth.api"
import type { AuthSession, User } from "./types"

type Status = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: User | null
  status: Status
  // login ปกติ: backend ส่ง user มาด้วยแล้ว → เซ็ตได้เลย
  signInWithSession: (session: AuthSession) => void
  // OAuth callback: refresh token อยู่ใน httpOnly cookie แล้ว (backend ฝังตอน
  // redirect) → แลก access ผ่าน /refresh แล้วดึง /me — ไม่พึ่ง token ใน URL
  hydrateFromOAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>("loading")
  const queryClient = useQueryClient()

  // ตอนโหลดแอป: rehydrate สถานะ login
  //  - แท็บนี้มี access token อยู่แล้ว (sessionStorage รอด reload) → /me ตรงๆ
  //  - แท็บใหม่/เพิ่งเปิดเบราว์เซอร์ → silent refresh ผ่าน cookie ก่อนหนึ่งครั้ง
  //    (รวมเคส migrate token ยุค localStorage — จัดการใน refreshSession แล้ว)
  useEffect(() => {
    async function boot() {
      try {
        if (!tokenStorage.getAccess()) await refreshSession()
        const u = await authApi.me()
        setUser(u)
        setStatus("authenticated")
      } catch {
        // ไม่มี cookie / token หมดอายุ / ถูก revoke → ถือว่ายังไม่ login
        tokenStorage.clear()
        setStatus("unauthenticated")
      }
    }
    void boot()
  }, [])

  function signInWithSession(session: AuthSession) {
    // ล้าง cache ของผู้ใช้ก่อนหน้า (ถ้ามี) กันข้อมูลคนเก่าค้างให้คนใหม่เห็น
    queryClient.clear()
    // refresh token ใน response (ช่วงเปลี่ยนผ่าน) จงใจ "ไม่เก็บ" —
    // ของจริงอยู่ใน httpOnly cookie ที่ backend ฝังมากับ response เดียวกัน
    tokenStorage.setAccess(session.accessToken)
    setUser(session.user)
    setStatus("authenticated")
  }

  async function hydrateFromOAuth() {
    queryClient.clear()
    await refreshSession() // cookie → access token ใหม่ลง sessionStorage
    const u = await authApi.me()
    setUser(u)
    setStatus("authenticated")
  }

  async function signOut() {
    // best-effort: revoke ฝั่ง server (token มากับ cookie) — error ไม่ขวาง logout
    await authApi.logout().catch(() => {})
    tokenStorage.clear()
    setUser(null)
    setStatus("unauthenticated")
    // ทิ้ง query cache ทั้งหมด → คนถัดไปที่ login จะไม่เห็นข้อมูลของคนนี้
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{ user, status, signInWithSession, hydrateFromOAuth, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
