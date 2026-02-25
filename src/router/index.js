// src/router/index.js
import { db } from '@/db'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
   history: createWebHistory(import.meta.env.BASE_URL),
   routes: [
      {
         path: '/',
         name: 'history',
         component: () => import('@/views/HistoryView.vue'),
         meta: {
            requiresAuth: true,
            title: 'ประวัติการสแกน'
         }
      },
      {
         path: '/login',
         name: 'login',
         component: () => import('@/views/LoginView.vue'),
         meta: {
            requiresAuth: false,
            title: 'เข้าสู่ระบบ'
         }
      },
      {
         path: '/otp-login',
         name: 'otp-login',
         component: () => import('@/views/OtpLoginView.vue'),
         meta: {
            requiresAuth: false,
            title: 'OTP Login'
         }
      },
      {
         path: '/otp-profile',
         name: 'OtpProfile',
         component: () => import('@/views/OtpProfileView.vue'),
         meta: {
            requiresAuth: false,
            title: 'ข้อมูลส่วนตัว'
         }
      },
      {
         path: '/scan',
         name: 'scan',
         component: () => import('@/views/HomeView.vue'),
         meta: {
            requiresAuth: true,
            title: 'สแกนป้ายทะเบียน'
         }
      },
      {
         path: '/settings',
         name: 'settings',
         component: () => import('@/views/SettingsSyncView.vue'),
         meta: {
            requiresAuth: true,
            title: 'ตั้งค่า'
         }
      },
      {
         path: '/sync-status',
         name: 'sync-settings',
         component: () => import('@/views/SettingsSyncView.vue'),
         meta: {
            requiresAuth: true,
            title: 'สถานะซิงค์ข้อมูล'
         }
      },
      // Catch all - 404
      {
         path: '/:pathMatch(.*)*',
         name: 'not-found',
         component: () => import('@/views/NotFoundView.vue'),
         meta: {
            requiresAuth: false,
            title: 'ไม่พบหน้าที่ค้นหา'
         }
      }
   ]
})

// Navigation Guard - ตรวจสอบ Authentication
router.beforeEach(async (to, from, next) => {
   // ตั้งค่า page title
   document.title = to.meta.title ? `${to.meta.title} - Vehicle Scanner` : 'Vehicle Scanner'

   // ตรวจสอบว่าต้อง login หรือไม่
   const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

   if (requiresAuth) {
      // เช็คว่ามี session ใน IndexedDB หรือไม่
      const session = await db.userSession.get(1)

      if (!session || !session.token) {
         // ไม่มี session - redirect ไป login
         next({
            name: 'otp-login',
            query: { redirect: to.fullPath } // เก็บ path เดิมไว้
         })
      } else {
         // มี session - ผ่าน
         next()
      }
   } else {
      // ไม่ต้อง auth
      next()
   }
})

// After navigation
router.afterEach((to, from) => {
   // Scroll to top
   window.scrollTo(0, 0)
})

export default router