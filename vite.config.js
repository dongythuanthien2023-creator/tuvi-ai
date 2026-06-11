import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' khi build cho desktop (Electron), '/tuvi-ai/' khi build cho web (GitHub Pages)
const isDesktop = process.env.BUILD_TARGET === 'desktop'

export default defineConfig({
  plugins: [react()],
  base: isDesktop ? './' : '/tuvi-ai/',
})
