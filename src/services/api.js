// src/services/api.js
import { db } from '@/db'
import axios from 'axios'

// ✅ เปลี่ยน URL ตามของจริง
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
   baseURL: API_BASE_URL,
   timeout: 30000,
   headers: {
      'Content-Type': 'application/json'
   }
})

// Request Interceptor - เพิ่ม token
api.interceptors.request.use(
   async (config) => {
      // อ่าน token จาก localStorage
      const loginData = localStorage.getItem('loginData')
      if (loginData) {
         const { token } = JSON.parse(loginData)
         if (token) {
            config.headers.Authorization = `Bearer ${token}`
         }
      }
      return config
   },
   (error) => {
      return Promise.reject(error)
   }
)

// Response Interceptor - จัดการ error และ response
api.interceptors.response.use(
   (response) => {
      // ✅ ถ้า response มี status field ให้ตรวจสอบ
      if (response.data && response.data.status === 'error') {
         return Promise.reject({
            response: {
               data: {
                  message: response.data.message || 'Unknown error'
               }
            }
         })
      }
      return response
   },
   async (error) => {
      // Token หมดอายุหรือไม่ valid
      if (error.response?.status === 401) {
         // ลบข้อมูลทั้ง localStorage และ IndexedDB
         localStorage.removeItem('loginData')
         await db.userSession.clear()

         // Redirect to login (ถ้าไม่อยู่ในหน้า login อยู่แล้ว)
         if (window.location.pathname !== '/login') {
            window.location.href = '/login'
         }
      }

      return Promise.reject(error)
   }
)

export { api }

// Login ด้วย OTP, ชื่อ, นามสกุล, เบอร์โทร
export async function loginWithOtp({ otp, firstName, lastName, phone }) {
   // ตัวอย่าง endpoint: /auth/otp-login
   const res = await api.post('/auth/otp-login', {
      otp,
      firstName,
      lastName,
      phone
   })
   // สมมติ response: { token, user }
   if (res.data && res.data.token) {
      // เก็บ token ลง localStorage และ IndexedDB
      localStorage.setItem('loginData', JSON.stringify({ token: res.data.token, user: res.data.user }))
      await db.userSession.put({ id: 1, token: res.data.token, user: res.data.user })
      return res.data
   } else {
      throw new Error('Login failed')
   }
}
