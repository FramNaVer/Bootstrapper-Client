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

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken })
  },
}
