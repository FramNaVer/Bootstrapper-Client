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
}
