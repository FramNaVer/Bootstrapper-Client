import { io, type Socket } from "socket.io-client"
import { tokenStorage } from "../api/tokenStorage"

// socket ตัวเดียวทั้งแอป (lazy) — เชื่อมต่อตอนใช้ครั้งแรก
// auth เป็นฟังก์ชัน → reconnect แต่ละครั้งหยิบ token ล่าสุดจาก storage เสมอ
let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      auth: (cb) => cb({ token: tokenStorage.getAccess() ?? "" }),
    })
  }
  return socket
}
