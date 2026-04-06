// vite.config.js
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
   plugins: [
      vue(),
      vuetify({ autoImport: true }),
      VitePWA({
         registerType: 'autoUpdate',
         manifest: {
            name: 'Vehicle Scanner',
            short_name: 'VScanner',
            description: 'ระบบสแกนป้ายทะเบียนรถ',
            theme_color: '#1976d2',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
               {
                  src: '/icon-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
               },
               {
                  src: '/icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png'
               }
            ]
         },
         workbox: {
            runtimeCaching: [
               {
                  urlPattern: /^https:\/\/api\./,
                  handler: 'NetworkFirst',
                  options: {
                     cacheName: 'api-cache',
                     expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 300 // 5 นาที
                     }
                  }
               }
            ]
         }
      })
   ],
   resolve: {
      alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url))
      }
   },
   define: {
      __APP_VERSION__: JSON.stringify(packageJson.version)
   },
   server: {
      port: 3000,
      host: '127.0.0.1'
   }
})