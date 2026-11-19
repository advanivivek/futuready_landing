import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// host: true serves the dev server on your Wi-Fi too, so you can open it on a phone (see README).
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5188 },
  preview: { host: true, port: 5189 },
})
