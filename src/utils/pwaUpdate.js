/**
 * PWA Update Handler
 * Notifies user when a new app version is available
 */
import { useSnackbar } from '@/composables/snackbar'

let updateSW = null

export function registerServiceWorkerUpdateHandler() {
   if (!navigator.serviceWorker) return

   navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker updated and controlling page')
      // Show update success message
      const snackbar = useSnackbar()
      snackbar.show('✓ แอปได้อัพเดทสำเร็จ', 'success', 3000)
   })

   navigator.serviceWorker.ready.then(registration => {
      // Check for updates every 30 seconds
      setInterval(() => {
         registration.update()
      }, 30000)

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
         const newWorker = registration.installing
         console.log('[PWA] New service worker found')

         newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
               // New service worker is installed and there's an active worker
               console.log('[PWA] New SW installed, showing update prompt')
               updateSW = newWorker

               const snackbar = useSnackbar()
               snackbar.show(
                  'มีเวอร์ชั่นใหม่พร้อม',
                  'info',
                  0,  // No auto-timeout when there are actions
                  [
                     {
                        label: 'อัพเดท',
                        callback: () => {
                           updateSW.postMessage({ type: 'SKIP_WAITING' })
                           window.location.reload()
                        }
                     },
                     {
                        label: 'ยกเลิก',
                        callback: () => { }
                     }
                  ]
               )
            }
         })
      })
   })
}

export function postMessageToSW(message) {
   if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
   }
}
