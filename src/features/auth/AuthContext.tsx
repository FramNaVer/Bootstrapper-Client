import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { tokenStorage } from "@/shared/api/tokenStorage"
import { authApi } from "./api/auth.api"
import type { AuthSession, User } from "./types"

type Status = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: User | null
  status: Status
  // login ปกติ: backend ส่ง user มาด้วยแล้ว → เซ็ตได้เลย
  signInWithSession: (session: AuthSession) => void
  // OAuth callback: มีแค่ token → ต้องไปดึง /me เอง
  hydrateFromTokens: (accessToken: string, refreshToken: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>("loading")

  // ตอนโหลดแอป: ถ้ามี token ค้างอยู่ ลองดึง /me เพื่อ rehydrate สถานะ login
  useEffect(() => {
    const token = tokenStorage.getAccess()
    if (!token) {
      setStatus("unauthenticated")
      return
    }
    authApi
      .me()
      .then((u) => {
        setUser(u)
        setStatus("authenticated")
      })
      .catch(() => {
        // token เสีย/หมดอายุและ refresh ไม่ได้ → ถือว่ายังไม่ login
        tokenStorage.clear()
        setStatus("unauthenticated")
      })
  }, [])

  function signInWithSession(session: AuthSession) {
    tokenStorage.set(session.accessToken, session.refreshToken)
    setUser(session.user)
    setStatus("authenticated")
  }

  async function hydrateFromTokens(accessToken: string, refreshToken: string) {
    tokenStorage.set(accessToken, refreshToken)
    const u = await authApi.me()
    setUser(u)
    setStatus("authenticated")
  }

  async function signOut() {
    const refreshToken = tokenStorage.getRefresh()
    // best-effort: revoke ฝั่ง server แต่ไม่ให้ error มาขวางการ logout ฝั่ง client
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
    tokenStorage.clear()
    setUser(null)
    setStatus("unauthenticated")
  }

  return (
    <AuthContext.Provider
      value={{ user, status, signInWithSession, hydrateFromTokens, signOut }}
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
