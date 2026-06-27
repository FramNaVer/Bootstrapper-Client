import { api } from "@/shared/api/client"
import type {
  Activity,
  Assignee,
  Board,
  Card,
  Comment,
  Label,
  List,
} from "../types"

// path ฐานของ board ภายใต้ org หนึ่ง
const base = (orgId: string) => `/organizations/${orgId}/boards`

export const boardApi = {
  // --- Boards ---
  async listBoards(orgId: string): Promise<Board[]> {
    const res = await api.get(base(orgId))
    return res.data.data.boards
  },
  async getBoard(orgId: string, boardId: string): Promise<Board> {
    const res = await api.get(`${base(orgId)}/${boardId}`)
    return res.data.data.board
  },
  async createBoard(
    orgId: string,
    data: { name: string; description?: string }
  ): Promise<Board> {
    const res = await api.post(base(orgId), data)
    return res.data.data.board
  },
  async updateBoard(
    orgId: string,
    boardId: string,
    data: { name?: string; description?: string | null }
  ): Promise<Board> {
    const res = await api.patch(`${base(orgId)}/${boardId}`, data)
    return res.data.data.board
  },
  async deleteBoard(orgId: string, boardId: string): Promise<void> {
    await api.delete(`${base(orgId)}/${boardId}`)
  },

  // --- Lists ---
  async listLists(orgId: string, boardId: string): Promise<List[]> {
    const res = await api.get(`${base(orgId)}/${boardId}/lists`)
    return res.data.data.lists
  },
  async createList(
    orgId: string,
    boardId: string,
    name: string
  ): Promise<List> {
    const res = await api.post(`${base(orgId)}/${boardId}/lists`, { name })
    return res.data.data.list
  },
  async updateList(
    orgId: string,
    boardId: string,
    listId: string,
    data: { name?: string; position?: number }
  ): Promise<List> {
    const res = await api.patch(
      `${base(orgId)}/${boardId}/lists/${listId}`,
      data
    )
    return res.data.data.list
  },
  async deleteList(
    orgId: string,
    boardId: string,
    listId: string
  ): Promise<void> {
    await api.delete(`${base(orgId)}/${boardId}/lists/${listId}`)
  },

  // --- Cards ---
  async listCards(orgId: string, boardId: string): Promise<Card[]> {
    const res = await api.get(`${base(orgId)}/${boardId}/cards`)
    return res.data.data.cards
  },
  async createCard(
    orgId: string,
    boardId: string,
    data: { listId: string; title: string }
  ): Promise<Card> {
    const res = await api.post(`${base(orgId)}/${boardId}/cards`, data)
    return res.data.data.card
  },
  // ใช้ในสเต็ปถัดไป (drag) — client คำนวณ position แล้วส่งมา
  async moveCard(
    orgId: string,
    boardId: string,
    cardId: string,
    data: { targetListId: string; position: number }
  ): Promise<Card> {
    const res = await api.patch(
      `${base(orgId)}/${boardId}/cards/${cardId}/move`,
      data
    )
    return res.data.data.card
  },
  async getCard(orgId: string, boardId: string, cardId: string): Promise<Card> {
    const res = await api.get(`${base(orgId)}/${boardId}/cards/${cardId}`)
    return res.data.data.card
  },
  async updateCard(
    orgId: string,
    boardId: string,
    cardId: string,
    // dueDate: ISO string เพื่อ "ตั้ง", null เพื่อ "ล้าง", undefined = ไม่แตะ
    data: { title?: string; description?: string | null; dueDate?: string | null }
  ): Promise<Card> {
    const res = await api.patch(`${base(orgId)}/${boardId}/cards/${cardId}`, data)
    return res.data.data.card
  },
  async deleteCard(orgId: string, boardId: string, cardId: string): Promise<void> {
    await api.delete(`${base(orgId)}/${boardId}/cards/${cardId}`)
  },

  // --- Comments ---
  async listComments(
    orgId: string,
    boardId: string,
    cardId: string
  ): Promise<Comment[]> {
    const res = await api.get(
      `${base(orgId)}/${boardId}/cards/${cardId}/comments`
    )
    return res.data.data.comments
  },
  async addComment(
    orgId: string,
    boardId: string,
    cardId: string,
    body: string
  ): Promise<void> {
    await api.post(`${base(orgId)}/${boardId}/cards/${cardId}/comments`, { body })
  },
  async deleteComment(
    orgId: string,
    boardId: string,
    cardId: string,
    commentId: string
  ): Promise<void> {
    await api.delete(
      `${base(orgId)}/${boardId}/cards/${cardId}/comments/${commentId}`
    )
  },

  // --- Assignees ---
  async listAssignees(
    orgId: string,
    boardId: string,
    cardId: string
  ): Promise<Assignee[]> {
    const res = await api.get(
      `${base(orgId)}/${boardId}/cards/${cardId}/assignees`
    )
    return res.data.data.assignees
  },
  async assignMember(
    orgId: string,
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<void> {
    await api.post(`${base(orgId)}/${boardId}/cards/${cardId}/assignees`, {
      userId,
    })
  },
  async unassignMember(
    orgId: string,
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<void> {
    await api.delete(
      `${base(orgId)}/${boardId}/cards/${cardId}/assignees/${userId}`
    )
  },

  // --- Labels (board-level + ติด/ถอดจากการ์ด) ---
  async listBoardLabels(orgId: string, boardId: string): Promise<Label[]> {
    const res = await api.get(`${base(orgId)}/${boardId}/labels`)
    return res.data.data.labels
  },
  async createLabel(
    orgId: string,
    boardId: string,
    data: { name: string; color: string }
  ): Promise<Label> {
    const res = await api.post(`${base(orgId)}/${boardId}/labels`, data)
    return res.data.data.label
  },
  async listCardLabels(
    orgId: string,
    boardId: string,
    cardId: string
  ): Promise<Label[]> {
    const res = await api.get(`${base(orgId)}/${boardId}/cards/${cardId}/labels`)
    return res.data.data.labels
  },
  async attachLabel(
    orgId: string,
    boardId: string,
    cardId: string,
    labelId: string
  ): Promise<void> {
    await api.post(`${base(orgId)}/${boardId}/cards/${cardId}/labels`, {
      labelId,
    })
  },
  async detachLabel(
    orgId: string,
    boardId: string,
    cardId: string,
    labelId: string
  ): Promise<void> {
    await api.delete(
      `${base(orgId)}/${boardId}/cards/${cardId}/labels/${labelId}`
    )
  },

  // --- Activity feed ---
  async listActivities(orgId: string, boardId: string): Promise<Activity[]> {
    const res = await api.get(`${base(orgId)}/${boardId}/activities`)
    return res.data.data.activities
  },
}
