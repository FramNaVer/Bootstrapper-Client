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
