import { api } from "@/shared/api/client"
import type { AppNotification } from "../types"

export const notificationApi = {
  async list(): Promise<{
    notifications: AppNotification[]
    unreadCount: number
  }> {
    const res = await api.get("/notifications")
    return res.data.data
  },
  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },
  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all")
  },
}
