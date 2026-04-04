// src/main.js
import { createPinia } from 'pinia'
import Camera from "simple-vue-camera"
import { createApp } from 'vue'
import App from './App.vue'
import './assets/minimal.css'
import vuetify from './plugins/vuetify'
import router from './router'
import { syncService } from './services/sync'
import { registerServiceWorkerUpdateHandler } from './utils/pwaUpdate'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.component('Camera', Camera)

app.mount('#app')

// Start Sync Service globally
console.log('🚀 Starting sync service...')
syncService.start()

// Register PWA update handler
if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => {
      navigator.serviceWorker
         .register('/service-worker.js')
         .then((registration) => {
            console.log('✓ Service Worker registered:', registration.scope)
            registerServiceWorkerUpdateHandler()
         })
         .catch((error) => {
            console.error('✗ Service Worker registration failed:', error)
         })
   })
}
