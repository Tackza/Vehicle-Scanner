// src/router/index.js
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
         path: '/unauthorized',
         name: 'unauthorized',
         component: () => import('@/views/UnauthorizedView.vue'),
         meta: {
            requiresAuth: false,
            title: 'ไม่ได้รับการยืนยัน'
         }
      },
      // {
      //    path: '/login',
      //    name: 'login',
      //    component: () => import('@/views/LoginView.vue'),
      //    meta: {
      //       requiresAuth: false,
      //       title: 'เข้าสู่ระบบ'
      //    }
      // },
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
         path: '/auth/qr',
         name: 'AuthQr',
         component: () => import('@/views/OtpProfileView.vue'),
         meta: {
            requiresAuth: false,
            title: 'QR Login'
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
router.beforeEach((to, from, next) => {
   // ตั้งค่า page title
   document.title = to.meta.title ? `${to.meta.title} - Vehicle Scanner` : 'Vehicle Scanner'

   // ตรวจสอบว่ามี userId ใน localStorage หรือไม่
   const userIdData = localStorage.getItem('userId')
   const hasUserId = !!userIdData

   // ตรวจสอบว่าต้อง login หรือไม่
   const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

   if (requiresAuth) {
      if (!hasUserId) {
         // ไม่มี userId - redirect ไปหน้า /auth/qr เพื่อสมัคร
         next({
            name: 'AuthQr',
         })
         // next()
      } else {
         // มี userId - ผ่าน
         next()
      }
   } else {
         next()
   }
})

// After navigation
router.afterEach((to, from) => {
   // Scroll to top
   window.scrollTo(0, 0)
})

export default router