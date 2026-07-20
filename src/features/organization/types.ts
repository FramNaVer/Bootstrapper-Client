export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

export interface Organization {
  id: string
  name: string
  slug: string
  // role ของเราใน org นี้ — มาตอน list (create จะไม่มี)
  role?: MembershipRole
  // userId ของผู้ก่อตั้ง — ใช้ปกป้อง/แสดงป้าย (org เก่าอาจเป็น null)
  createdById?: string | null
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
  // เวลา active ล่าสุด (ISO) — ใช้คำนวณ "ออนไลน์"/"เห็นล่าสุดเมื่อ" (null = ยังไม่เคยออนไลน์)
  lastSeenAt: string | null
}

// การ์ดบนปฏิทินรวมของ org (จาก GET /organizations/:orgId/cards)
// — ต่างจาก Card ของ board ตรงที่แนบ boardName มาบอกว่ามาจากบอร์ดไหน
export interface DueCard {
  id: string
  boardId: string
  listId: string
  title: string
  dueDate: string
  boardName: string
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
