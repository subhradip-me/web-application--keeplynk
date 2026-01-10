import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    server: {
    host: true,        // 🔥 THIS FIXES 403
    port: 5173,
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev'
    ]
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'KeepLynk',
        short_name: 'KeepLynk',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],

        // 🔥 THIS IS IMPORTANT (Share Target)
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'files',
                accept: ['*/*']
              }
            ]
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
