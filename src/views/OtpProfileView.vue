<template>
   <v-container class="fill-height" fluid style="background: var(--color-bg);">
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4" style="max-width: 380px;">
            <div class="text-center mb-6">
               <div
                  style="width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <v-icon color="white" size="30">mdi-camera</v-icon>
               </div>
               <div style="font-size: 22px; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
                  Vehicle Scanner
               </div>
               <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px;">
                  ระบบสแกนป้ายทะเบียน
               </div>
            </div>
            <!-- <div class="text-center mb-8"> -->
            <!-- <div style="font-size: 20px; font-weight: 800; color: var(--color-text);">เข้าสู่ระบบด้วย</div> -->
            <!-- <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px;">วาง URL ที่สแกนจาก QR
                  code หรือกรอกข้อมูล</div> -->
            <!-- </div> -->

            <div v-if="isExistingUser && isLoading" class="text-center">
               <v-progress-circular indeterminate color="#1C1917" size="48" class="mb-4"></v-progress-circular>
               <p style="color: var(--color-text); font-weight: 700;">กำลังซิงค์ข้อมูล...</p>
            </div>
            <div v-else-if="!loginData">
               <form @submit.prevent="submitLogin" class="minimal-form">
                  <div class="mb-4">
                     <label
                        style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">ชื่อ</label>
                     <v-text-field v-model="firstName" placeholder="กรอกชื่อ" hide-details="auto" density="comfortable"
                        maxlength="50" />
                  </div>
                  <div class="mb-4">
                     <label
                        style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">นามสกุล</label>
                     <v-text-field v-model="lastName" placeholder="กรอกนามสกุล" hide-details="auto"
                        density="comfortable" maxlength="50" />
                  </div>
                  <div class="mb-6">
                     <label
                        style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">เบอร์โทร</label>
                     <v-text-field v-model="mobileNo" placeholder="08xxxxxxx" maxlength="10" inputmode="tel"
                        hide-details="auto" density="comfortable" />
                  </div>
                  <!-- <div class="mb-6">
                        <label
                           style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">QR
                           Token</label>
                        <v-text-field v-model="qrToken" placeholder="QR Token" hide-details="auto"
                           density="comfortable" />
                     </div> -->
                  <v-btn type="submit" color="#1C1917" block size="large" rounded="lg"
                     style="font-weight: 700; font-size: 16px;">เข้าสู่ระบบ</v-btn>
               </form>
            </div>
            <div v-else>
               <p class="text-center" style="color: var(--color-text); font-weight: 700;">เข้าสู่ระบบสำเร็จ</p>
            </div>
            <v-snackbar v-model="snackbar" :timeout="5000" rounded="lg">
               <span style="color: #222;" class="d-flex justify-center text-center">{{ snackbarText }}</span>
            </v-snackbar>
            <div v-if="error" class="text-center" style="color:red; margin-top: 16px;">{{ error }}</div>
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>

import { api } from '@/services/api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const qrUrl = ref('')
const qrToken = ref('')
const firstName = ref('')
const lastName = ref('')
const mobileNo = ref('')
const loginData = ref(null)
const snackbar = ref(false)
const snackbarText = ref('')
const error = ref('')
const isExistingUser = ref(false)
const isLoading = ref(false)


onMounted(() => {
   // Extract token from query params if present (for /auth/qr)
   const urlParams = new URLSearchParams(window.location.search)
   const token = urlParams.get('token')
   if (token) {
      qrToken.value = token
      qrUrl.value = window.location.href
   }
   // Check for existing userId
   const userIdData = localStorage.getItem('userId')
   if (userIdData) {
      isExistingUser.value = true
      // Call API to sync/update user info and get token
      syncUserProfile()
      return
   }


})

async function syncUserProfile() {
   isLoading.value = true
   error.value = ''
   try {
      const userIdData = localStorage.getItem('userId')
      console.log('userIdData :>> ', userIdData);
      let userId = null
      try {
         const parsed = JSON.parse(userIdData)
         userId = parsed.userId
      } catch (e) {
         console.error('Invalid userId data:', e)
      }

      if (!userId) {
         snackbarText.value = 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
         snackbar.value = true
         localStorage.removeItem('userId')
         localStorage.removeItem('loginData')
         localStorage.removeItem('syncUserData')
         router.push({ name: 'AuthQr' })
         return
      }

      // TODO: เมื่อ API endpoint พร้อม ให้เปลี่ยน '/park/qr-check' เป็น endpoint ที่ถูกต้อง
      const response = await api.post('/park/qr-check', {
         user_id: userId,
         qr_token: qrToken.value
      })

      const { status, result } = response.data

      if (status === 'success' && result) {
         // Store full user data for display
         localStorage.setItem('syncUserData', JSON.stringify({
            id: result.user.id,
            username: result.user.username,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            mobile_no: result.user.mobile_no
         }))

         // Update token in localStorage
         localStorage.setItem('loginData', JSON.stringify({
            token: result.park_token,
            username: result.user.username,
            loginAt: new Date().toISOString()
         }))

         loginData.value = response.data
         snackbarText.value = 'เข้าสู่ระบบสำเร็จ!'
         snackbar.value = true
         setTimeout(() => {
            router.push('/')
         }, 1000)
      } else {
         router.push({ name: 'unauthorized' })
         throw new Error('Invalid response format')
      }
   } catch (err) {
      if (err.response) {
         const errorData = err.response.data
         error.value = errorData.message || 'ไม่สามารถซิงค์ข้อมูลได้'
      } else if (err.request) {
         error.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      } else {
         error.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
      // router.push({ name: 'unauthorized' })
      snackbarText.value = error.value
      snackbar.value = true
      isExistingUser.value = false
   } finally {
      isLoading.value = false
   }
}

function extractToken() {
   try {
      const url = new URL(qrUrl.value)
      const token = url.searchParams.get('token')
      if (token) {
         qrToken.value = token
         error.value = ''
      } else {
         error.value = 'ไม่พบ token ใน URL'
      }
   } catch (e) {
      error.value = 'URL ไม่ถูกต้อง'
   }
}

async function submitLogin() {
   error.value = ''
   // Validate mobile number: must start with 06, 08, or 09 and be 10 digits
   const mobilePattern = /^(06|08|09)\d{8}$/;
   if (!firstName.value || !lastName.value || !mobilePattern.test(mobileNo.value)) {
      snackbarText.value = 'กรุณากรอกข้อมูลให้ครบถ้วน และเบอร์โทรต้องขึ้นต้นด้วย 06, 08 หรือ 09'
      snackbar.value = true
      return
   }
   try {
      const response = await api.post('/park/qr-login', {
         qr_token: qrToken.value,
         first_name: firstName.value,
         last_name: lastName.value,
         mobile_no: mobileNo.value,
      })
      const { status, result } = response.data
      console.log('{ status, result }  :>> ', { status, result });

      if (status === 'success' && result) {
         // Store user ID
         localStorage.setItem('userId', JSON.stringify({
            userId: result.user.id,
         }))

         // Store full user data for display
         localStorage.setItem('syncUserData', JSON.stringify({
            id: result.user.id,
            username: result.user.username,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            mobile_no: result.user.mobile_no
         }))

         localStorage.setItem('loginData', JSON.stringify({
            token: result.park_token,
            username: result.user.username,
            loginAt: new Date().toISOString()
         }))

         loginData.value = response.data
         snackbarText.value = 'เข้าสู่ระบบสำเร็จ!'
         snackbar.value = true
         setTimeout(() => {
            router.push('/')
         }, 1000)
      } else {
         throw new Error('Invalid response format')
      }
   } catch (error) {
      if (error.response) {
         const errorData = error.response.data
         error.value = errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      } else if (error.request) {
         error.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      } else {
         error.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }

      snackbarText.value = error.value
      snackbar.value = true
   }
}
</script>
