// payload ต่าง type กัน — ตอนนี้มี ORG_INVITE
export interface NotificationPayload {
  organizationId?: string
  organizationName?: string
  token?: string
}

export interface AppNotification {
  id: string
  type: string
  payload: NotificationPayload | null
  readAt: string | null
  createdAt: string
}
