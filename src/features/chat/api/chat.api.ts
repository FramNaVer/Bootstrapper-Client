import { api } from "@/shared/api/client"
import type { Message, MessagePage } from "../types"

export const chatApi = {
  // ประวัติแชท (ใหม่→เก่า) — cursor: โหลดต่อจากหน้าก่อน, ไม่ส่ง = เริ่มจากล่าสุด
  async list(orgId: string, cursor?: string): Promise<MessagePage> {
    const res = await api.get(`/organizations/${orgId}/messages`, {
      params: cursor ? { cursor } : {},
    })
    return res.data.data
  },

  async send(orgId: string, body: string): Promise<Message> {
    const res = await api.post(`/organizations/${orgId}/messages`, { body })
    return res.data.data.message
  },
}
