import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // xlsx & @react-pdf/renderer được nạp động (dynamic import) trong code nên
  // tự động tách thành chunk riêng, chỉ tải khi người dùng export/import —
  // giảm mạnh kích thước bundle khởi động ban đầu.
})
