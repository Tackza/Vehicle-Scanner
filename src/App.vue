<template>
   <v-app>
      <!-- Minimal App Bar -->
      <v-app-bar v-if="showNav" elevation="0" height="56" class="minimal-app-bar">
         <div class="page-header" style="width: 100%;">
            <span class="page-header__title">{{ pageTitle }}</span>
            <div class="d-flex align-center" style="gap: 6px;">
               <v-icon :color="online ? 'success' : 'warning'" size="16">
                  {{ online ? 'mdi-wifi' : 'mdi-wifi-off' }}
               </v-icon>
               <span
                  :style="{ fontSize: '12px', fontWeight: 600, color: online ? 'var(--color-success)' : 'var(--color-warning)' }">
                  {{ online ? 'Online' : 'Offline' }}
               </span>
            </div>
         </div>
      </v-app-bar>

      <!-- Main Content -->
      <v-main :style="{ background: 'var(--color-bg)' }">
         <router-view />
      </v-main>

      <!-- Minimal Bottom Navigation -->
      <div v-if="showNav" class="minimal-bottom-nav d-flex align-center"
         style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; padding-bottom: env(safe-area-inset-bottom);">
         <button class="flex-grow-1 d-flex flex-column align-center justify-center"
            style="height: 68px; border: none; background: transparent; cursor: pointer; gap: 3px;"
            @click="$router.push('/')">
            <v-icon :color="activeNav === 'history' ? '#563dea' : '#A8A29E'" size="24">mdi-home-variant-outline</v-icon>
            <span
               :style="{ fontSize: '11px', fontWeight: activeNav === 'history' ? 700 : 500, color: activeNav === 'history' ? '#563dea' : '#A8A29E' }">ประวัติ</span>
         </button>

         <button class="d-flex align-center justify-center scan-btn-nav" @click="openCamera" :disabled="cameraLoading">
            <v-icon v-if="!cameraLoading" color="white" size="24">mdi-camera</v-icon>
            <v-progress-circular v-else size="24" width="2" color="white" indeterminate></v-progress-circular>
         </button>

         <button class="flex-grow-1 d-flex flex-column align-center justify-center"
            style="height: 68px; border: none; background: transparent; cursor: pointer; gap: 3px;"
            @click="$router.push('/settings')">
            <v-icon :color="activeNav === 'settings' ? '#563dea' : '#A8A29E'" size="24">mdi-cog-outline</v-icon>
            <span
               :style="{ fontSize: '11px', fontWeight: activeNav === 'settings' ? 700 : 500, color: activeNav === 'settings' ? '#563dea' : '#A8A29E' }">ตั้งค่า</span>
         </button>
      </div>

      <!-- Camera Dialog -->
      <CameraDialog v-model="cameraDialog" @capture="handleCameraCapture" />

      <!-- Network Status Component -->
      <NetworkStatus />

      <!-- Global Snackbar -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom center"
         rounded="lg">
         <div class="d-flex justify-space-between align-center" style="width: 100%; gap: 12px;">
            <span>{{ snackbar.message }}</span>
            <div v-if="snackbar.actions?.length" class="d-flex" style="gap: 8px;">
               <button v-for="action in snackbar.actions" :key="action.label"
                  @click="() => { action.callback?.(); snackbar.show = false }" style="
                     background: transparent;
                     border: none;
                     color: white;
                     font-weight: 600;
                     cursor: pointer;
                     font-size: 12px;
                     text-transform: uppercase;
                     letter-spacing: 0.5px;
                  ">
                  {{ action.label }}
               </button>
            </div>
         </div>
      </v-snackbar>

      <!-- Global Success Popup -->
      <v-dialog v-model="successPopup" fullscreen persistent transition="scale-transition">
         <v-card class="d-flex flex-column align-center justify-center success-overlay" style="height:100vh;">
            <div
               style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center;">
               <v-icon size="50" color="white">mdi-check</v-icon>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: white; margin-top: 24px; letter-spacing: 0.02em;">
               บันทึกสำเร็จ</div>
            <div style="font-size: 15px; color: rgba(255,255,255,0.8); margin-top: 8px;">ข้อมูลถูกบันทึกแล้ว</div>
         </v-card>
      </v-dialog>
   </v-app>
</template>

<script setup>
import CameraDialog from '@/components/CameraDialog.vue'
import NetworkStatus from '@/components/NetworkStatus.vue'
import { useSnackbar } from '@/composables/snackbar'
import { useGPS } from '@/services/gps'
import { resizeImage, useOCR } from '@/services/ocr'
import { useOnline } from '@/utils/offline'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

let route = null
let router = null
try {
   route = useRoute()
   router = useRouter()
} catch (e) {
   // Router context not available yet, will be set on mount
}
const { snackbar } = useSnackbar()
const online = useOnline()
const { processImage } = useOCR()
const { getCurrentPosition } = useGPS()

const cameraDialog = ref(false)
const hideNavBar = ref(false)
const successPopup = ref(false)
const cameraLoading = ref(false)
let successTimeout = null

const playSuccessSound = () => {
   const audio = new Audio('/success.mp3')
   audio.play()
}

onMounted(() => {
   window.addEventListener('showSuccessPopup', () => {
      successPopup.value = true
      playSuccessSound()
      if (successTimeout) clearTimeout(successTimeout)
      successTimeout = setTimeout(() => {
         successPopup.value = false
         window.dispatchEvent(new CustomEvent('successPopupClosed'))
      }, 3000)
   })
})

// ฟัง event เพื่อซ่อน/แสดง navigation bar
onMounted(() => {
   if (!route) route = useRoute()
   if (!router) router = useRouter()

   window.addEventListener('toggleNavBar', (event) => {
      hideNavBar.value = event.detail.hide
   })
})

// Page title based on route
const pageTitle = computed(() => {
   const routeName = route?.name
   if (routeName === 'history') return 'ประวัติ'
   if (routeName === 'settings' || routeName === 'sync-settings') return 'ตั้งค่า'
   if (routeName === 'scan') return 'สแกน'
   return 'ระบบสแกนป้ายทะเบียน'
})

// ซ่อน nav bar ในหน้า login, otp-login, otp-profile
const showNav = computed(() => {
   const hideOn = ['login', 'otp-login', 'OtpProfile', 'not-found', 'scan', 'AuthQr', 'unauthorized']
   return route && !hideOn.includes(route.name)
})

// ตัวบอกว่ากำลังอยู่ที่เมนูไหน
const activeNav = computed(() => {
   const routeName = route?.name
   if (routeName === 'home') return 'home'
   if (routeName === 'history') return 'history'
   if (routeName === 'settings' || routeName === 'sync-settings') return 'settings'
   return 'history'
})

// ฟังก์ชันเปิดกล้อง
const openCamera = () => {
   cameraLoading.value = true
   cameraDialog.value = true
   // Clear loading after a short delay (camera dialog should be visible)
   setTimeout(() => {
      cameraLoading.value = false
   }, 3000)
}

// ฟังก์ชันจัดการการถ่ายรูป (image อาจเป็น base64 หรือ object)
const handleCameraCapture = async (image) => {
   if (!image) return

   let file = null
   // รองรับทั้ง base64 string และ object ที่คืนมาจาก simple-vue-camera
   if (typeof image === 'string') {
      // แปลง base64 เป็นไฟล์
      function dataURLtoFile(dataurl, filename) {
         const arr = dataurl.split(',')
         const mime = arr[0].match(/:(.*?);/)[1]
         const bstr = atob(arr[1])
         let n = bstr.length
         const u8arr = new Uint8Array(n)
         while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
         }
         return new File([u8arr], filename, { type: mime })
      }
      file = dataURLtoFile(image, 'capture.jpg')
   } else if (image && typeof image === 'object') {
      // simple-vue-camera อาจคืน blob หรือ object { image }
      if (image instanceof Blob) {
         file = new File([image], 'capture.jpg', { type: image.type || 'image/jpeg' })
      } else if (image.image && typeof image.image === 'string') {
         // กรณี { image: base64 }
         function dataURLtoFile(dataurl, filename) {
            const arr = dataurl.split(',')
            const mime = arr[0].match(/:(.*?);/)[1]
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) {
               u8arr[n] = bstr.charCodeAt(n)
            }
            return new File([u8arr], filename, { type: mime })
         }
         file = dataURLtoFile(image.image, 'capture.jpg')
      }
   }

   if (!file) return

   // Resize image if larger than 50KB
   let processedFile = file
   if (file.size > 50 * 1024) {
      try {
         processedFile = await resizeImage(file, {
            maxWidth: 800,
            maxHeight: 800,
            mimeType: 'image/jpeg',
            quality: 0.7
         })
      } catch (e) {
         console.warn('Resize image failed, using original file.', e)
      }
   }

   if (router && route?.name !== 'scan') {
      await router.push('/scan')
   }

   setTimeout(async () => {
      try {
         const gps = await getCurrentPosition()
         const result = await processImage(processedFile)

         console.log('📸 Camera Result:', result)
         window.dispatchEvent(new CustomEvent('cameraResult', {
            detail: { ...result, gps }
         }))
      } catch (error) {
         console.error('❌ OCR Error:', error)
         window.dispatchEvent(new CustomEvent('cameraResult', {
            detail: {
               success: false,
               requireManualInput: true,
               message: 'เกิดข้อผิดพลาด กรุณากรอกเอง'
            }
         }))
      }
   }, 100)
}
</script>

<style>
/* Bottom nav safe area for mobile */
.minimal-bottom-nav {
   padding-bottom: max(8px, env(safe-area-inset-bottom));
}

/* Ensure main content doesn't overlap bottom nav */
.v-main {
   padding-bottom: 80px !important;
}
</style>
