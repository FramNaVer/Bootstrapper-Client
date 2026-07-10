import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type Theme = "light" | "dark"

// ธีมเริ่มต้น = สิ่งที่ theme-init.ts ตัดสินไปแล้ว (อ่านจาก class บน <html>)
// อ่านจากที่เดียวกันเสมอ → state ของ React กับหน้าจอจริงไม่มีทางเห็นต่างกัน
function getInitialTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "light",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // theme เปลี่ยน → sync class บน <html> (จุดที่ CSS token .dark ทำงาน)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark"
      // กดสลับเอง = "เลือกแล้ว" → จำไว้ ครั้งหน้าไม่ตามธีม OS อีก
      localStorage.setItem("theme", next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
