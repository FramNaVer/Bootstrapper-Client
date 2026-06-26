import { api } from "@/shared/api/client"
import type { Board, Card, List } from "../types"

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
}
