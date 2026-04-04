<template>
   <v-container class="px-5 pt-2">
      <!-- Project Info -->
      <div v-if="projectName !== null" class="mb-5" style="text-align:center;">
         <div v-if="projectName" style="font-size: 18px; font-weight: 700; color: var(--color-primary);">
            {{ projectName }}
            <span v-if="!isProjectActive"
               style="color: var(--color-error); font-size: 13px; font-weight: 400; display:block;">(หมดเวลาร่วมโครงการนี้แล้ว)</span>
         </div>
         <div v-else style="color: var(--color-error); font-size: 15px; font-weight: 500;">ไม่มีโครงการที่ใช้งานอยู่
         </div>
      </div>
      <!-- User Card -->
      <div v-if="userData" class="user-card mb-5">
         <div class="user-card__avatar">
            <v-icon color="white" size="22">mdi-account</v-icon>
         </div>
         <div style="flex: 1; min-width: 0;">
            <div class="user-card__name">{{ userData.first_name }} {{ userData.last_name }}</div>
            <div class="user-card__username">ID: {{ userData.id }}</div>
         </div>
         <div>
            <span class="status-badge" :class="online ? 'status-badge--online' : 'status-badge--offline'">
               {{ online ? 'ออนไลน์' : 'ออฟไลน์' }}
            </span>
         </div>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" class="mb-5">
         <div class="stat-box">
            <div class="stat-box__label">จำนวนสแกน</div>
            <div class="stat-box__value" style="color: var(--color-text);">{{ scannedCount }}</div>
         </div>
         <div class="stat-box">
            <div class="stat-box__label">รอซิงค์</div>
            <div class="stat-box__value" style="color: var(--color-warning);">{{ unsyncedCount }}</div>
         </div>
         <div class="stat-box" style="grid-column: 1 / -1;">
            <div class="stat-box__label">Sync ที่มีปัญหา</div>
            <div class="stat-box__value" style="color: var(--color-error);">{{ syncErrorCount }}</div>
         </div>
      </div>

      <!-- Menu -->
      <div
         style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden;">
         <div class="menu-item" @click="syncNow">
            <v-icon size="20">mdi-sync</v-icon>
            <span style="flex: 1;">ซิงค์ข้อมูลตอนนี้</span>
            <v-icon size="18" color="#A8A29E">mdi-chevron-right</v-icon>
         </div>

         <div class="menu-divider"></div>

         <!-- <div class="menu-item menu-item--warning" @click="clearCache">
            <v-icon size="20" color="#D97706">mdi-delete-sweep</v-icon>
            <span style="flex: 1;">ล้างแคช</span>
            <v-icon size="18" color="#A8A29E">mdi-chevron-right</v-icon>
         </div> -->

         <div class="menu-item" @click="exportData">
            <v-icon size="20">mdi-download</v-icon>
            <span style="flex: 1;">ส่งออกข้อมูล</span>
            <v-icon size="18" color="#A8A29E">mdi-chevron-right</v-icon>
         </div>

         <div class="menu-divider"></div>

         <div class="menu-item menu-item--error" @click="logout">
            <v-icon size="20" color="#DC2626">mdi-logout</v-icon>
            <span style="flex: 1;">ออกจากระบบ</span>
            <v-icon size="18" color="#A8A29E">mdi-chevron-right</v-icon>
         </div>
      </div>
   </v-container>
</template>

<script setup>
import { useSnackbar } from '@/composables/snackbar'
import { db, exportData as dbExportData } from '@/db'
import { api } from '@/services/api'
import { syncService } from '@/services/sync'
import { useOnline } from '@/utils/offline'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'


const router = useRouter()
const { show: showSnackbar } = useSnackbar()
const online = useOnline()

const userData = ref(null)
const scannedCount = ref(0)
const unsyncedCount = ref(0)
const syncErrorCount = ref(0)

const projectId = ref(null)
const projectName = ref(null) // null = loading, '' = ไม่มี, string = มี
const isProjectActive = ref(false)

onMounted(async () => {
   // Get user data from localStorage
   try {
      const userIdData = localStorage.getItem('userId')
      if (userIdData) {
         const parsed = JSON.parse(userIdData)
         // Try to get full user data from sessionStorage or localStorage
         const syncUserData = localStorage.getItem('syncUserData')
         if (syncUserData) {
            userData.value = JSON.parse(syncUserData)
         } else {
            // Fallback: use just userId if full data not available
            userData.value = {
               id: parsed.userId,
               first_name: 'User',
               last_name: ''
            }
         }
      }
   } catch (error) {
      console.error('Error loading user data:', error)
   }
   await loadStats()
   await fetchProject()
})

async function fetchProject() {
   projectName.value = null // loading
   try {
      const res = await api.get('/park/projects')
      console.log('res :>> ', res);
      const list = res.data?.result || []
      console.log('list :>> ', list);
      if (list.length > 0) {
         // เก็บ project ทั้งหมดลง local db
         await db.projects.clear()
         await db.projects.bulkAdd(list)
         // เอา project ตัวแรก (หรือจะเลือก logic อื่นก็ได้)
         const project = list[0]
         projectId.value = project.project_id
         projectName.value = project.name
         // ตรวจสอบช่วงเวลา
         isProjectActive.value = checkProjectActive(project.start_time, project.end_time)
      } else {
         await db.projects.clear()
         projectId.value = null
         projectName.value = ''
         isProjectActive.value = false
      }
   } catch (e) {
      // Fallback: ใช้ข้อมูลโครงการจาก local db
      try {
         const localProjects = await db.projects.toArray()
         if (localProjects.length > 0) {
            const project = localProjects[0]
            projectId.value = project.project_id
            projectName.value = project.name
            isProjectActive.value = checkProjectActive(project.start_time, project.end_time)
         } else {
            projectId.value = null
            projectName.value = ''
            isProjectActive.value = false
         }
      } catch (err) {
         projectId.value = null
         projectName.value = ''
         isProjectActive.value = false
      }
   }
}

function checkProjectActive(start, end) {
   if (!start || !end) return false
   const now = new Date()
   const startTime = new Date(start)
   const endTime = new Date(end)
   return now >= startTime && now <= endTime
}

const loadStats = async () => {
   scannedCount.value = await db.scannedPlates.count()
   unsyncedCount.value = await db.scannedPlates.where('synced').equals(0).count()

   const syncErrors = await db.syncQueue
      .where('retryCount')
      .above(0)
      .count()
   syncErrorCount.value = syncErrors
}

const syncNow = async () => {
   showSnackbar('กำลังซิงค์ข้อมูล...', 'info')
   await syncService.syncToServer()
   await loadStats()
   showSnackbar('ซิงค์ข้อมูลสำเร็จ', 'success')
}

const clearCache = async () => {
   if (!confirm('ต้องการล้างแคชทั้งหมด? (ข้อมูลที่ยังไม่ซิงค์จะหายไป)')) return

   try {
      await db.scannedPlates.clear()
      await loadStats()
      showSnackbar('ล้างแคชสำเร็จ', 'success')
   } catch (error) {
      console.error('Clear cache error:', error)
      showSnackbar('เกิดข้อผิดพลาด', 'error')
   }
}

const exportData = async () => {
   try {
      const data = await dbExportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vehicle-scanner-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      showSnackbar('ส่งออกข้อมูลสำเร็จ', 'success')
   } catch (error) {
      console.error('Export error:', error)
      showSnackbar('เกิดข้อผิดพลาด', 'error')
   }
}

const logout = async () => {
   if (!confirm('ต้องการออกจากระบบ?')) return

   try {
      const token = localStorage.getItem('loginData') ? JSON.parse(localStorage.getItem('loginData')).token : null
      // Call logout API
      await api.post('/park/logout', {
         authorization: `Bearer ${token || ''}`
      })


      localStorage.removeItem('userId')
      localStorage.removeItem('loginData')
      localStorage.removeItem('syncUserData')
      showSnackbar('ออกจากระบบสำเร็จ', 'success')
      router.push({ name: 'unauthorized' })
   } catch (error) {
      console.error('Logout error:', error)
      showSnackbar('เกิดข้อผิดพลาด', 'error')
   }
}
</script>
