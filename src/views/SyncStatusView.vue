<template>
   <v-container>
      <v-card class="mb-4">
         <v-card-title>
            <v-icon left>mdi-sync</v-icon>
            สถานะซิงค์ข้อมูล

            <v-spacer />

            <v-chip :color="online ? 'success' : 'warning'" size="small">
               <v-icon left size="small">{{ online ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
               {{ online ? 'Online' : 'Offline' }}
            </v-chip>
         </v-card-title>

         <v-card-text>
            <v-row>
               <v-col cols="12" md="6">
                  <v-card variant="outlined">
                     <v-card-title class="text-h6">ข้อมูลที่สแกน</v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-primary">{{ scannedCount }}</div>
                        <div class="text-caption">รายการทั้งหมด</div>
                        <v-divider class="my-2" />
                        <div class="d-flex justify-space-between mb-1">
                           <span>ซิงค์แล้ว:</span>
                           <span class="text-success font-weight-bold">{{ syncedCount }}</span>
                        </div>
                        <div class="d-flex justify-space-between mb-1">
                           <span>รอซิงค์:</span>
                           <span class="text-warning font-weight-bold">{{ unsyncedCount }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                           <span>อัตราสำเร็จ:</span>
                           <span class="font-weight-bold">{{ syncRate }}%</span>
                        </div>
                     </v-card-text>
                  </v-card>
               </v-col>

               <v-col cols="12" md="6">
                  <v-card variant="outlined">
                     <v-card-title class="text-h6">ข้อมูลการลงทะเบียน</v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-primary">{{ registeredCount }}</div>
                        <div class="text-caption">รายการทั้งหมด</div>
                        <v-divider class="my-2" />
                        <div class="text-caption">
                           อัปเดตล่าสุด: {{ lastUpdate }}
                        </div>
                     </v-card-text>
                  </v-card>
               </v-col>
            </v-row>

            <!-- Failed Syncs Section -->
            <v-card v-if="failedSyncs.length > 0" variant="outlined" class="mt-4" color="error">
               <v-card-title class="text-subtitle-1">
                  <v-icon left color="error">mdi-alert-circle</v-icon>
                  รายการที่ซิงค์ไม่สำเร็จ ({{ failedSyncs.length }})
               </v-card-title>
               <v-card-text>
                  <v-list density="compact">
                     <v-list-item v-for="item in failedSyncs.slice(0, 5)" :key="item.id">
                        <v-list-item-title>{{ item.plateNumber }}</v-list-item-title>
                        <v-list-item-subtitle>
                           พยายาม {{ item.retryCount || 0 }} ครั้ง
                        </v-list-item-subtitle>
                     </v-list-item>
                  </v-list>
                  <v-btn v-if="online" color="primary" variant="tonal" size="small" block class="mt-2"
                     @click="retryFailedSyncs">
                     <v-icon left>mdi-refresh</v-icon>
                     ลองซิงค์อีกครั้ง
                  </v-btn>
               </v-card-text>
            </v-card>

            <!-- Action Buttons -->
            <v-row class="mt-4">
               <v-col>
                  <v-btn color="primary" block :disabled="!online || syncing" :loading="syncing" @click="manualSync">
                     <v-icon left>mdi-sync</v-icon>
                     ซิงค์ข้อมูลตอนนี้
                  </v-btn>
               </v-col>
               <v-col>
                  <v-btn color="secondary" variant="outlined" block @click="refreshStats">
                     <v-icon left>mdi-refresh</v-icon>
                     รีเฟรช
                  </v-btn>
               </v-col>
            </v-row>
         </v-card-text>
      </v-card>
   </v-container>
</template>

<script setup>
import { useSnackbar } from '@/composables/snackbar'
import { db, getFailedSyncs, getSyncStats, resetRetryCount } from '@/db'
import { syncService } from '@/services/sync'
import { useOnline } from '@/utils/offline'
import { onMounted, onUnmounted, ref } from 'vue'

const { showSnackbar } = useSnackbar()
const online = useOnline()

const scannedCount = ref(0)
const syncedCount = ref(0)
const unsyncedCount = ref(0)
const syncRate = ref(0)
const registeredCount = ref(0)
const lastUpdate = ref('-')
const failedSyncs = ref([])
const syncing = ref(false)

let refreshInterval = null

onMounted(async () => {
   await loadStats()

   // Auto refresh every 10 seconds
   refreshInterval = setInterval(() => {
      loadStats()
   }, 10000)

   // Listen for sync events
   window.addEventListener('sync-completed', handleSyncCompleted)
})

onUnmounted(() => {
   if (refreshInterval) {
      clearInterval(refreshInterval)
   }
   window.removeEventListener('sync-completed', handleSyncCompleted)
})

const handleSyncCompleted = async () => {
   await loadStats()
}

const loadStats = async () => {
   const stats = await getSyncStats()
   scannedCount.value = stats.total
   syncedCount.value = stats.synced
   unsyncedCount.value = stats.pending
   syncRate.value = stats.syncRate

   registeredCount.value = await db.registeredVehicles.count()
   failedSyncs.value = await getFailedSyncs()

   const latest = await db.registeredVehicles.orderBy('updatedAt').reverse().first()
   if (latest) {
      lastUpdate.value = new Date(latest.updatedAt).toLocaleString('th-TH')
   }
}

const refreshStats = async () => {
   showSnackbar('กำลังรีเฟรช...', 'info')
   await loadStats()
   showSnackbar('รีเฟรชสำเร็จ', 'success')
}

const manualSync = async () => {
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

const retryFailedSyncs = async () => {
   if (!online.value) {
      showSnackbar('ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'error')
      return
   }

   try {
      // Reset retry count for failed items
      const ids = failedSyncs.value.map(item => item.id)
      await resetRetryCount(ids)

      showSnackbar('รีเซ็ตสถานะสำเร็จ กำลังซิงค์อีกครั้ง...', 'info')

      // Try syncing again
      await manualSync()
   } catch (error) {
      showSnackbar('เกิดข้อผิดพลาด: ' + error.message, 'error')
   }
}
</script>