<template>
   <v-container class="fill-height" fluid style="background: var(--color-bg);">
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4" style="max-width: 380px;">
            <!-- Logo -->
            <div class="text-center mb-12">
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

            <!-- Form -->
            <v-form ref="form" @submit.prevent="handleLogin" class="minimal-form">
               <div class="mb-4">
                  <label
                     style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: 0.03em;">ชื่อผู้ใช้</label>
                  <v-text-field v-model="formData.username" placeholder="กรอกชื่อผู้ใช้" autofocus
                     :rules="[rules.required]" hide-details="auto" density="comfortable" />
               </div>

               <div class="mb-4">
                  <label
                     style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: 0.03em;">รหัสผ่าน</label>
                  <v-text-field v-model="formData.password" placeholder="กรอกรหัสผ่าน"
                     :type="showPassword ? 'text' : 'password'"
                     :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                     @click:append-inner="showPassword = !showPassword" :rules="[rules.required]" hide-details="auto"
                     density="comfortable" />
               </div>

               <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4" variant="tonal" rounded="lg"
                  border="start">
                  {{ errorMessage }}
               </v-alert>

               <v-btn color="#563dea" block size="large" type="submit" :loading="loading" rounded="lg" class="mt-2"
                  style="font-weight: 700; font-size: 16px; letter-spacing: 0;">
                  เข้าสู่ระบบ
               </v-btn>

               <v-btn variant="outlined" block size="large" class="mt-3" rounded="lg"
                  style="font-weight: 600; font-size: 15px; letter-spacing: 0; border-color: var(--color-border); color: var(--color-text-secondary);"
                  @click="goOtpLogin">
                  สมัครด้วย OTP
               </v-btn>
            </v-form>
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>
import { db } from '@/db'
import { api } from '@/services/api'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

onMounted(() => {
   const loginData = localStorage.getItem('loginData')
   if (loginData) {
      router.push('/')
   }
})

const form = ref(null)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const formData = reactive({
   username: '',
   password: ''
})

const rules = {
   required: (v) => !!v || 'กรุณากรอกข้อมูล'
}

function goOtpLogin() {
   router.push({ name: 'otp-login' })
}

const handleLogin = async () => {
   const { valid } = await form.value.validate()
   if (!valid) return

   loading.value = true
   errorMessage.value = ''

   try {
      const response = await api.post('/lpr/login', {
         username: formData.username,
         password: formData.password
      })

      const { status, result } = response.data

      if (status === 'success' && result) {
         await db.userSession.put({
            id: 1,
            token: result.lpr_token,
            userData: {
               id: result.user.id,
               username: result.user.username,
               firstName: result.user.first_name,
               lastName: result.user.last_name,
               note: result.user.note
            },
            loginAt: new Date()
         })

         localStorage.setItem('loginData', JSON.stringify({
            token: result.lpr_token,
            username: result.user.username,
            loginAt: new Date().toISOString()
         }))

         console.log('✓ Login successful:', result.user.username)
         router.push('/')
      } else {
         throw new Error('Invalid response format')
      }

   } catch (error) {
      console.error('Login error:', error)

      if (error.response) {
         const errorData = error.response.data
         errorMessage.value = errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      } else if (error.request) {
         errorMessage.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      } else {
         errorMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
   } finally {
      loading.value = false
   }
}
</script>
