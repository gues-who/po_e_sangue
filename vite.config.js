import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: { minify: false },
      manifest: {
        name: 'Pó e Sangue',
        short_name: 'Pó e Sangue',
        description: 'Ficha e rolagens — Velho Oeste, século XIX',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        start_url: '/po_e_sangue/',
        scope: '/po_e_sangue/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  base: '/po_e_sangue/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'firebase-auth': ['firebase/app', 'firebase/auth'],
          // firestore NÃO aparece aqui — será carregado dinamicamente (lazy)
        },
      },
    },
  },
})
