<template>
   <v-app>
      <!-- App Bar -->
      <v-app-bar v-if="showNav" elevation="0" color="white" density="compact" class="pt-2" height="60" rounded="b-lg">
         <p class="text-title-1  ml-3 ">ระบบสแกนป้ายทะเบียน</p>
         <v-spacer />

         <v-icon v-if="!online" color="warning" size="small" class="mr-3" variant="flat">mdi-wifi-off</v-icon>
         <v-icon v-else color="success" size="small" class="mr-3" variant="flat">mdi-wifi</v-icon>
         <!-- <v-chip v-else color="success" size="small" class="mr-3" variant="flat">
         </v-chip> -->
      </v-app-bar>

      <!-- Main Content -->
      <v-main>
         <router-view />
      </v-main>

      <!-- Bottom Navigation Bar -->
      <v-bottom-navigation v-if="showNav" :value="activeNav" mandatory elevation="0" bg-color="primary" mode="shift"
         grow>
         <v-btn value="" to="/">
            <v-icon size="34">mdi-home</v-icon>
            <span class="text-caption">ประวัติ</span>
         </v-btn>
         <v-btn value="scan" @click="openCamera">
            <v-icon size="34">mdi-camera</v-icon>
            <span class="text-caption">สแกน</span>
         </v-btn>
         <v-btn value="settings" to="/settings">
            <v-icon size="34">mdi-cog</v-icon>
            <span class="text-caption">ตั้งค่า</span>
         </v-btn>
      </v-bottom-navigation>

      <!-- Hidden camera input -->
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" @change="handleCameraCapture"
         style="display: none" />

      <!-- ✅ Network Status Component -->
      <NetworkStatus />

      <!-- Global Snackbar -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom center">
         {{ snackbar.message }}
      </v-snackbar>

      <!-- Global Success Popup -->
      <v-dialog v-model="successPopup" fullscreen persistent transition="scale-transition">
         <v-card class="d-flex flex-column align-center justify-center" style="height:100vh;background:#4caf50">
            <v-icon size="120" color="white">mdi-check-circle</v-icon>
            <div class="text-h3 font-weight-bold text-white mt-6 mb-2">บันทึกสำเร็จ</div>
            <div class="text-h5 text-white mb-8">ข้อมูลถูกบันทึกแล้ว</div>
         </v-card>
      </v-dialog>
   </v-app>
</template>

<script setup>
import NetworkStatus from '@/components/NetworkStatus.vue'
import { useSnackbar } from '@/composables/snackbar'
import { useGPS } from '@/services/gps'
import { useOCR } from '@/services/ocr'
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

const cameraInput = ref(null)
const hideNavBar = ref(false)
const successPopup = ref(false)
let successTimeout = null

const playSuccessSound = () => {
   const audio = new Audio('/success.mp3')
   audio.play()
}

onMounted(() => {
   // ...existing code...

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
   // Initialize route and router if not available
   if (!route) route = useRoute()
   if (!router) router = useRouter()

   window.addEventListener('toggleNavBar', (event) => {
      hideNavBar.value = event.detail.hide
   })
})

// ซ่อน nav bar ในหน้า login, otp-login, otp-profile
const showNav = computed(() => {
   const hideOn = ['login', 'otp-login', 'OtpProfile', 'not-found', 'scan']
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
   cameraInput.value.click()
}

// ฟังก์ชันจัดการการถ่ายรูป
const handleCameraCapture = async (event) => {
   const file = event.target.files[0]
   if (!file) return

   // รีเซ็ต input value เพื่อให้สามารถเลือกไฟล์เดียวกันได้
   event.target.value = ''

   // ตรวจสอบว่าอยู่หน้า scan แล้วหรือไม่
   if (router && route?.name !== 'scan') {
      // ถ้ายังไม่ได้อยู่หน้า scan ก็นำไป
      await router.push('/scan')
   }

   // รอให้ component render เสร็จ
   setTimeout(async () => {
      try {
         const gps = await getCurrentPosition()
         const result = await processImage(file)

         // emit event ผ่าน window event
         window.dispatchEvent(new CustomEvent('cameraResult', {
            detail: { ...result, gps }
         }))
      } catch (error) {
         console.error(error)
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