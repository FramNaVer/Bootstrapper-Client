import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    // alias @ → src (เหมือน @shared/@modules ฝั่ง backend แต่ฝั่งนี้ใช้ตัวเดียวพอ)
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
})
