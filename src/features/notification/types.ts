// payload ต่าง type กัน — ตอนนี้มี ORG_INVITE
export interface NotificationPayload {
  organizationId?: string
  organizationName?: string
  // คำเชิญอ้างอิงด้วย id (backend เช็คสิทธิ์จาก JWT + email ตรง)
  invitationId?: string
  // notification รุ่นเก่าเคยเก็บ raw token — คงไว้ให้ข้อมูลเดิมใน DB ยังกดรับได้
  // ลบ field นี้ได้หลังล้าง notification เก่าแล้ว
  token?: string
}

export interface AppNotification {
  id: string
  type: string
  payload: NotificationPayload | null
  readAt: string | null
  createdAt: string
}
