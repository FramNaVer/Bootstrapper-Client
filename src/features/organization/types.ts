export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

export interface Organization {
  id: string
  name: string
  slug: string
  // role ของเราใน org นี้ — มาตอน list (create จะไม่มี)
  role?: MembershipRole
  createdAt: string
  updatedAt: string
}

// สมาชิกใน org (ใช้ตอนเลือกคนมอบหมายการ์ด)
export interface Member {
  userId: string
  email: string
  displayName: string | null
  role: MembershipRole
  joinedAt: string
}

// คำเชิญที่ยังค้าง (PENDING)
export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: MembershipRole
  status: string
  expiresAt: string
  createdAt: string
}
