import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Plain React single-page app. The API lives in the Worker (worker/index.ts).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
  server: {
    port: 3000,
    // For `npm run dev`: run `npm run dev:api` in another terminal.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
