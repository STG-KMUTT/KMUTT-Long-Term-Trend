import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set base to '/<repo-name>/' before deploying.
// Override via env: VITE_BASE='/your-repo/' npm run build
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
