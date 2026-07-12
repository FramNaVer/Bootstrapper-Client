// payload ต่าง type กัน — ตอนนี้มี ORG_INVITE
// (field token ของ notification รุ่นเก่าถูกถอดแล้ว — ข้อมูลเก่าใน DB ล้างหมดแล้ว)
export interface NotificationPayload {
  organizationId?: string
  organizationName?: string
  // คำเชิญอ้างอิงด้วย id (backend เช็คสิทธิ์จาก JWT + email ตรง)
  invitationId?: string
}

export interface AppNotification {
  id: string
  type: string
  payload: NotificationPayload | null
  readAt: string | null
  createdAt: string
}
