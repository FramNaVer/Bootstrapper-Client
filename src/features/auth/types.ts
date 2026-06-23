// shape ของ user ที่ backend ส่งกลับ (ตรงกับ UserEntity ฝั่ง API)
export interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: "USER" | "ADMIN"
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  displayName?: string
  email: string
  password: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: User
}
