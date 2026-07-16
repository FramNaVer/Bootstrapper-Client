// =============================================================
// ESLint (flat config) — React SPA
// =============================================================
// จับสิ่งที่ tsc มองไม่เห็น: กฎ hooks (deps ขาด/เรียกใน condition),
// component ที่ hot-reload ไม่ได้ (react-refresh), ลืม await ฯลฯ
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // rule ใหม่ (v6): ห้าม setState ตรงๆ ใน effect — โค้ดเรามี 3 จุดที่เป็น
      // pattern "sync state จาก URL/route" โดยเจตนา (ปิด drawer ตอนเปลี่ยนหน้า,
      // เปิด modal จาก ?card=, อ่าน token จากลิงก์) refactor ได้แต่เสี่ยงเปลี่ยน
      // พฤติกรรม UI → ลดเป็น warn ให้ยังมองเห็น ไว้แก้ตอนแตะไฟล์นั้นจริง
      "react-hooks/set-state-in-effect": "warn",
      // Vite HMR: ไฟล์ที่ export component ปนกับอย่างอื่นจะ full-reload แทน hot-swap
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
)
