import { api } from "@/shared/api/client"
import type {
  DueCard,
  Invitation,
  Member,
  MembershipRole,
  Organization,
} from "../types"

export const organizationApi = {
  // org ทั้งหมดที่เราเป็นสมาชิก (พร้อม role)
  async list(): Promise<Organization[]> {
    const res = await api.get("/organizations")
    return res.data.data.organizations
  },

  async create(name: string): Promise<Organization> {
    const res = await api.post("/organizations", { name })
    return res.data.data.organization
  },

  // สมาชิกทั้งหมดของ org (ใช้เป็นตัวเลือกตอนมอบหมายการ์ด)
  async listMembers(orgId: string): Promise<Member[]> {
    const res = await api.get(`/organizations/${orgId}/members`)
    return res.data.data.members
  },
  async changeMemberRole(
    orgId: string,
    userId: string,
    role: MembershipRole
  ): Promise<void> {
    await api.patch(`/organizations/${orgId}/members/${userId}`, { role })
  },
  async removeMember(orgId: string, userId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/members/${userId}`)
  },

  // ปฏิทินรวม: การ์ดทุกบอร์ดที่มีกำหนดส่งในช่วง [dueFrom, dueTo] (YYYY-MM-DD)
  async listDueCards(
    orgId: string,
    dueFrom: string,
    dueTo: string
  ): Promise<DueCard[]> {
    const res = await api.get(`/organizations/${orgId}/cards`, {
      params: { dueFrom, dueTo },
    })
    return res.data.data.cards
  },

  // --- Invitations ---
  // คืน acceptUrl กลับมา → เอาไป "คัดลอกลิงก์เชิญ" ได้เลย (ไม่ต้องพึ่ง email)
  async inviteMember(
    orgId: string,
    email: string,
    role: MembershipRole
  ): Promise<{ acceptUrl: string }> {
    const res = await api.post(`/organizations/${orgId}/invitations`, {
      email,
      role,
    })
    return res.data.data
  },
  async listInvitations(orgId: string): Promise<Invitation[]> {
    const res = await api.get(`/organizations/${orgId}/invitations`)
    return res.data.data.invitations
  },
  async revokeInvitation(orgId: string, invitationId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/invitations/${invitationId}`)
  },

  // รับคำเชิญ (คนที่ login อยู่ + อีเมลตรงกับที่ถูกเชิญ) — endpoint อยู่นอก /organizations
  async acceptInvitation(
    token: string
  ): Promise<{ organizationId: string; role: MembershipRole }> {
    const res = await api.post(`/invitations/accept`, { token })
    return res.data.data
  },

  // รับคำเชิญจากกระดิ่งแจ้งเตือน — อ้างด้วย id ไม่ใช่ token
  async acceptInvitationById(
    invitationId: string
  ): Promise<{ organizationId: string; role: MembershipRole }> {
    const res = await api.post(`/invitations/${invitationId}/accept`)
    return res.data.data
  },
}
