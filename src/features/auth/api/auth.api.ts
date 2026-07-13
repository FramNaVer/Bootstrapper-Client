import { api } from "@/shared/api/client"
import type { AuthSession, LoginInput, RegisterInput, User } from "../types"

// ชั้น "คุยกับ API" ของ feature auth (เทียบเท่า repository ฝั่ง backend)
// hook/component ไม่ต้องรู้รูปแบบ response { success, data } — แกะให้ที่นี่
export const authApi = {
  async login(input: LoginInput): Promise<AuthSession> {
    const res = await api.post("/auth/login", input)
    return res.data.data
  },

  async register(input: RegisterInput): Promise<User> {
    const res = await api.post("/auth/register", input)
    return res.data.data.user
  },

  async me(): Promise<User> {
    const res = await api.get("/auth/me")
    return res.data.data.user
  },

  // refresh token ไปกับ httpOnly cookie (เบราว์เซอร์แนบเอง) — ไม่ต้องส่งอะไรใน body
  async logout(): Promise<void> {
    await api.post("/auth/logout", {})
  },

  // ยืนยันอีเมลด้วย token จากลิงก์ในเมล
  async verifyEmail(token: string): Promise<void> {
    await api.post("/auth/verify-email", { token })
  },

  // ขอส่งเมลยืนยันอีกครั้ง — backend ตอบเหมือนกันเสมอไม่ว่า email มีจริงไหม
  async resendVerification(email: string): Promise<void> {
    await api.post("/auth/resend-verification", { email })
  },

  // ขอลิงก์รีเซ็ตรหัสผ่าน — backend ตอบเหมือนกันเสมอ (กัน enumeration)
  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email })
  },

  // ตั้งรหัสใหม่ด้วย token จากลิงก์ในเมล (สำเร็จแล้วทุก session เก่าถูกปิด)
  async resetPassword(token: string, password: string): Promise<void> {
    await api.post("/auth/reset-password", { token, password })
  },
}
