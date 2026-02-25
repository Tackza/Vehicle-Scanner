<template>
   <v-container>
      <!-- User Info Card -->
      <v-card class="mb-4">
         <v-card-title>
            <v-icon left>mdi-account</v-icon>
            ข้อมูลผู้ใช้
         </v-card-title>

         <v-card-text>
            <v-list-item v-if="userData">
               <template v-slot:prepend>
                  <v-avatar color="primary">
                     <v-icon>mdi-account</v-icon>
                  </v-avatar>
               </template>
               <v-list-item-title>
                  {{ userData.firstName }} {{ userData.lastName }}
               </v-list-item-title>
               <v-list-item-subtitle>
                  @{{ userData.username }} (ID: {{ userData.id }})
               </v-list-item-subtitle>
               <v-list-item-subtitle v-if="userData.note" class="mt-1">
                  <v-chip size="x-small" color="info">{{ userData.note }}</v-chip>
               </v-list-item-subtitle>
            </v-list-item>
         </v-card-text>
      </v-card>

      <!-- Offline Status Card -->
      <v-card class="mb-4" :color="online ? '' : 'warning'" variant="tonal">
         <v-card-title>
            <v-icon left>{{ online ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
            สถานะการเชื่อมต่อ
         </v-card-title>
         <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
               <span class="font-weight-medium">สถานะ:</span>
               <v-chip :color="online ? 'success' : 'warning'" size="small">
                  {{ online ? 'ออนไลน์' : 'ออฟไลน์' }}
               </v-chip>
            </div>
            <!-- <div v-if="syncStats" class="d-flex align-center justify-space-between">
               <span class="font-weight-medium">รอซิงค์:</span>
               <v-chip :color="syncStats.pending > 0 ? 'warning' : 'success'" size="small">
                  {{ syncStats.pending }} รายการ
               </v-chip>
            </div> -->
         </v-card-text>
      </v-card>

      <!-- Settings Menu -->
      <v-card>
         <v-card-title>
            <v-icon left>mdi-cog</v-icon>
            เมนูการตั้งค่า
         </v-card-title>

         <v-card-text>
            <v-list>
               <v-list-item @click="syncNow" :disabled="!online || syncing">
                  <template v-slot:prepend>
                     <v-icon :class="{ 'rotating': syncing }">mdi-sync</v-icon>
                  </template>
                  <v-list-item-title>
                     {{ syncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลตอนนี้' }}
                  </v-list-item-title>
                  <template v-if="!online" v-slot:append>
                     <v-chip size="x-small" color="warning">Offline</v-chip>
                  </template>
               </v-list-item>

               <v-list-item @click="viewSyncStatus">
                  <template v-slot:prepend>
                     <v-icon>mdi-information</v-icon>
                  </template>
                  <v-list-item-title>สถานะซิงค์ข้อมูล</v-list-item-title>
                  <template v-if="syncStats && syncStats.pending > 0" v-slot:append>
                     <v-chip size="x-small" color="warning">{{ syncStats.pending }}</v-chip>
                  </template>
               </v-list-item>

               <v-divider class="my-2" />

               <v-list-item @click="clearCache">
                  <template v-slot:prepend>
                     <v-icon color="warning">mdi-delete-sweep</v-icon>
                  </template>
                  <v-list-item-title>ล้างแคช</v-list-item-title>
               </v-list-item>

               <v-list-item @click="exportData">
                  <template v-slot:prepend>
                     <v-icon>mdi-download</v-icon>
                  </template>
                  <v-list-item-title>ส่งออกข้อมูล</v-list-item-title>
               </v-list-item>

               <v-divider class="my-2" />

               <v-list-item @click="logout">
                  <template v-slot:prepend>
                     <v-icon color="error">mdi-logout</v-icon>
                  </template>
                  <v-list-item-title>ออกจากระบบ</v-list-item-title>
               </v-list-item>
            </v-list>
         </v-card-text>
      </v-card>
   </v-container>
</template>

<script setup>
import { useSnackbar } from '@/composables/snackbar'
import { db, exportData as dbExportData, getSyncStats } from '@/db'
import { syncService } from '@/services/sync'
import { useOnline } from '@/utils/offline'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { showSnackbar } = useSnackbar()
const online = useOnline()

const userData = ref(null)
const syncing = ref(false)
const syncStats = ref(null)

let statsInterval = null

onMounted(async () => {
   const session = await db.userSession.get(1)
   userData.value = session?.userData
   console.log('User session:', session)

   // Load sync stats
   await refreshSyncStats()

   // Auto refresh stats every 10 seconds
   statsInterval = setInterval(refreshSyncStats, 10000)

   // Listen for sync events
   window.addEventListener('sync-completed', handleSyncCompleted)
})

onUnmounted(() => {
   if (statsInterval) {
      clearInterval(statsInterval)
   }
   window.removeEventListener('sync-completed', handleSyncCompleted)
})

const refreshSyncStats = async () => {
   syncStats.value = await getSyncStats()
}

const handleSyncCompleted = async () => {
   await refreshSyncStats()
}

const syncNow = async () => {
   if (!online.value) {
      showSnackbar('ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'error')
      return
   }

   syncing.value = true
   showSnackbar('กำลังซิงค์ข้อมูล...', 'info')

   try {
      window.dispatchEvent(new CustomEvent('sync-started'))
      const result = await syncService.syncToServer()
      window.dispatchEvent(new CustomEvent('sync-completed', { detail: result }))

      if (result.success) {
         showSnackbar(`ซิงค์สำเร็จ ${result.synced || 0} รายการ`, 'success')
      } else {
         showSnackbar('การซิงค์ไม่สำเร็จ', 'error')
      }
   } catch (error) {
      showSnackbar('เกิดข้อผิดพลาด: ' + error.message, 'error')
   } finally {
      syncing.value = false
   }
}

const viewSyncStatus = () => {
   router.push('/sync-status')
}

const clearCache = async () => {
   if (!confirm('ต้องการล้างแคชทั้งหมด? (ข้อมูลที่ยังไม่ซิงค์จะหายไป)')) return

   try {
      await db.scannedPlates.clear()
      await refreshSyncStats()
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
      await db.userSession.clear()
      // ลบข้อมูล login จาก localStorage
      localStorage.removeItem('loginData')
      showSnackbar('ออกจากระบบสำเร็จ', 'success')
      router.push('/login')
   } catch (error) {
      console.error('Logout error:', error)
   }
}
</script>

<style scoped>
@keyframes rotate {
   from {
      transform: rotate(0deg);
   }

   to {
      transform: rotate(360deg);
   }
}

.rotating {
   animation: rotate 2s linear infinite;
}
</style>