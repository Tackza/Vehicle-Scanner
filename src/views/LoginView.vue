<template>
   <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-0">


               <v-toolbar color="white" class="text-center" dark flat>
                  <v-toolbar-title>
                     ระบบสแกนป้ายทะเบียน
                  </v-toolbar-title>
               </v-toolbar>

               <v-card-text>
                  <v-form ref="form" @submit.prevent="handleLogin">
                     <v-text-field v-model="formData.username" label="ชื่อผู้ใช้" prepend-inner-icon="mdi-account"
                        autofocus variant="outlined" :rules="[rules.required]" class="mb-3"
                        :persistent-placeholder="false" />

                     <v-text-field v-model="formData.password" label="รหัสผ่าน" prepend-inner-icon="mdi-lock"
                        :type="showPassword ? 'text' : 'password'"
                        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showPassword = !showPassword" variant="outlined" :rules="[rules.required]"
                        :persistent-placeholder="false" />

                     <v-alert v-if="errorMessage" type="error" density="compact" class="mb-3">
                        {{ errorMessage }}
                     </v-alert>

                     <v-btn color="primary" block size="large" type="submit" :loading="loading">
                        เข้าสู่ระบบ
                     </v-btn>
                     <v-btn color="secondary" block size="large" class="mt-15" @click="goOtpLogin">
                        สมัคร
                     </v-btn>
                  </v-form>
               </v-card-text>
            </v-card>
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

// เช็คว่าเคยเข้าสู่ระบบมาก่อนหรือไม่
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
      // เรียก API login
      const response = await api.post('/lpr/login', {
         username: formData.username,
         password: formData.password
      })

      // ✅ ปรับให้ตรงกับ response structure ที่ได้จริง
      const { status, result } = response.data

      if (status === 'success' && result) {
         // บันทึก token และ user data ใน IndexedDB
         await db.userSession.put({
            id: 1,
            token: result.lpr_token,  // ✅ ใช้ lpr_token
            userData: {
               id: result.user.id,
               username: result.user.username,
               firstName: result.user.first_name,
               lastName: result.user.last_name,
               note: result.user.note
            },
            loginAt: new Date()
         })

         // เก็บข้อมูล login ใน localStorage
         localStorage.setItem('loginData', JSON.stringify({
            token: result.lpr_token,
            username: result.user.username,
            loginAt: new Date().toISOString()
         }))

         console.log('✓ Login successful:', result.user.username)

         // Redirect ไปหน้า history
         const redirect = '/'
         router.push(redirect)
      } else {
         throw new Error('Invalid response format')
      }

   } catch (error) {
      console.error('Login error:', error)

      // ✅ จัดการ error ให้ดีขึ้น
      if (error.response) {
         // Server responded with error
         const errorData = error.response.data
         errorMessage.value = errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      } else if (error.request) {
         // Request made but no response
         errorMessage.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      } else {
         // Something else happened
         errorMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
   } finally {
      loading.value = false
   }
}
</script>