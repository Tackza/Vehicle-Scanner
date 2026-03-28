// src/main.js
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import { syncService } from './services/sync'
import './assets/minimal.css'
import Camera from "simple-vue-camera";

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.component('Camera', Camera)

app.mount('#app')

// Start Sync Service globally
console.log('🚀 Starting sync service...')
syncService.start()

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => {
      navigator.serviceWorker
         .register('/service-worker.js')
         .then((registration) => {
            console.log('✓ Service Worker registered:', registration.scope)

            // Check for updates periodically
            setInterval(() => {
               registration.update()
            }, 60000) // Check every minute
         })
         .catch((error) => {
            console.error('✗ Service Worker registration failed:', error)
         })
   })
}
