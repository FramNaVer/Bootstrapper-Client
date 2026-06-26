import { api } from "@/shared/api/client"
import type { Member, Organization } from "../types"

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
}
