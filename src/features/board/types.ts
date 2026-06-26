export interface Board {
  id: string
  organizationId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  organizationId: string
  boardId: string
  name: string
  position: number
  createdAt: string
  updatedAt: string
}

// ข้อมูลย่อที่ติดมากับการ์ดตอน list (ใช้โชว์ chip บนการ์ด)
export interface CardLabelSummary {
  id: string
  name: string
  color: string
}
export interface CardAssigneeSummary {
  userId: string
  displayName: string | null
  email: string
}

export interface Card {
  id: string
  organizationId: string
  boardId: string
  listId: string
  title: string
  description: string | null
  position: number
  dueDate: string | null
  createdAt: string
  updatedAt: string
  // มาเฉพาะตอน listCards (getCard/move ไม่ส่งมา) → optional
  labels?: CardLabelSummary[]
  assignees?: CardAssigneeSummary[]
}

// ป้ายกำกับ (board-level) — สีเก็บเป็น hex
export interface Label {
  id: string
  organizationId: string
  boardId: string
  name: string
  color: string
}

// คนที่ถูกมอบหมายให้การ์ด (backend join ข้อมูล user มาให้แล้ว)
export interface Assignee {
  cardId: string
  membershipId: string
  userId: string
  email: string
  displayName: string | null
  assignedAt: string
}

// ความเห็นในการ์ด — backend แนบชื่อ/อีเมลคนเขียนมาด้วย
export interface Comment {
  id: string
  cardId: string
  authorId: string
  authorName: string | null
  authorEmail: string
  body: string
  createdAt: string
  updatedAt: string
}
