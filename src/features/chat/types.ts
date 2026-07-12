// ข้อความแชท — backend แนบชื่อ/อีเมลผู้เขียนมาแล้ว (client ไม่ต้อง lookup)
export interface Message {
  id: string
  organizationId: string
  authorId: string
  body: string
  createdAt: string
  authorName: string | null
  authorEmail: string
}

// หนึ่งหน้าของประวัติ (cursor pagination): nextCursor = null คือหมดแล้ว
export interface MessagePage {
  messages: Message[]
  nextCursor: string | null
}
