// ต้องมาก่อนทุกอย่าง: ตั้ง class ธีมบน <html> ก่อน React วาดเฟรมแรก
import "@/shared/theme/theme-init"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
