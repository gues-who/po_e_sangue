import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/po_e_sangue/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-app':  ['firebase/app', 'firebase/auth'],
          'firebase-db':   ['firebase/firestore'],
        },
      },
    },
  },
})
