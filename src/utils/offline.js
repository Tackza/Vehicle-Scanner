// src/utils/offline.js
import { onMounted, onUnmounted, ref } from 'vue'

export const useOnline = () => {
   const online = ref(navigator.onLine)

   const updateOnlineStatus = () => {
      const newStatus = navigator.onLine
      const wasOnline = online.value
      online.value = newStatus

      // Emit custom events for status changes
      if (wasOnline !== newStatus) {
         const event = new CustomEvent('network-status-changed', {
            detail: { online: newStatus }
         })
         window.dispatchEvent(event)
      }
   }

   onMounted(() => {
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
   })

   onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
   })

   return online
}

export const isOnline = () => navigator.onLine

// Check if we have a working internet connection (not just connected to network)
export const checkConnectivity = async (timeout = 5000) => {
   if (!navigator.onLine) {
      return false
   }

   try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch('/api/health', {
         method: 'HEAD',
         cache: 'no-cache',
         signal: controller.signal
      }).catch(() => {
         // Fallback to checking a CDN
         return fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
         })
      })

      clearTimeout(timeoutId)
      return response.ok || response.type === 'opaque'
   } catch (error) {
      return false
   }
}

// Wait for online connection
export const waitForOnline = () => {
   return new Promise((resolve) => {
      if (navigator.onLine) {
         resolve()
      } else {
         const handler = () => {
            window.removeEventListener('online', handler)
            resolve()
         }
         window.addEventListener('online', handler)
      }
   })
}

// Retry function with exponential backoff
export const retryWithBackoff = async (
   fn,
   maxRetries = 3,
   baseDelay = 1000
) => {
   let lastError

   for (let i = 0; i < maxRetries; i++) {
      try {
         return await fn()
      } catch (error) {
         lastError = error

         if (i < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, i)
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`)
            await new Promise(resolve => setTimeout(resolve, delay))
         }
      }
   }

   throw lastError
}