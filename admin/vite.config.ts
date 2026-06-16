import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Back-office Marco (separe du site Astro public).
// Port 4322 : evite le conflit avec le dev server Astro (4321).
export default defineConfig({
  plugins: [react()],
  server: { port: 4322 },
})
