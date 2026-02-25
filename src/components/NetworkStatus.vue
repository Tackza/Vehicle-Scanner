<template>
   <v-snackbar v-model="showOffline" :timeout="-1" color="warning" location="top" elevation="24">
      <div class="d-flex align-center">
         <v-icon left>mdi-wifi-off</v-icon>
         <div class="ml-2">
            <div class="font-weight-medium">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</div>
            <div class="text-caption">ข้อมูลจะถูกบันทึกในเครื่องและซิงค์เมื่อกลับมาออนไลน์</div>
            <!-- <div v-if="pendingCount > 0" class="text-caption mt-1">
               📊 รอซิงค์: {{ pendingCount }} รายการ
            </div> -->
         </div>
      </div>

      <template v-slot:actions>
         <v-btn size="small" @click="showOffline = false">
            ปิด
         </v-btn>
      </template>
   </v-snackbar>

   <v-snackbar v-model="showOnline" :timeout="3000" color="success" location="top">
      <div class="d-flex align-center">
         <v-icon left>mdi-wifi</v-icon>
         <div class="ml-2">
            <div class="font-weight-medium">เชื่อมต่ออินเทอร์เน็ตแล้ว</div>
            <!-- <div v-if="pendingCount > 0" class="text-caption">กำลังซิงค์ข้อมูล {{ pendingCount }} รายการ...</div> -->
         </div>
      </div>
   </v-snackbar>

   <!-- Sync Progress Snackbar -->
   <v-snackbar v-model="showSyncProgress" :timeout="-1" color="info" location="bottom">
      <div class="d-flex align-center">
         <v-progress-circular indeterminate size="20" width="2" class="mr-3" />
         <!-- <div>
            <div class="font-weight-medium">กำลังซิงค์ข้อมูล...</div>
            <div class="text-caption">{{ syncStatus }}</div>
         </div> -->
      </div>
   </v-snackbar>
</template>

<script setup>
import { getSyncStats } from '@/db'
import { syncService } from '@/services/sync'
import { useOnline } from '@/utils/offline'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const online = useOnline()
const showOffline = ref(false)
const showOnline = ref(false)
const showSyncProgress = ref(false)
const syncStatus = ref('')
const pendingCount = ref(0)

let syncStatsInterval = null

// Update pending count periodically
const updatePendingCount = async () => {
   const stats = await getSyncStats()
   pendingCount.value = stats.pending
}

onMounted(() => {
   updatePendingCount()
   syncStatsInterval = setInterval(updatePendingCount, 5000)

   // Listen for sync events
   window.addEventListener('sync-started', handleSyncStarted)
   window.addEventListener('sync-completed', handleSyncCompleted)
})

onUnmounted(() => {
   if (syncStatsInterval) {
      clearInterval(syncStatsInterval)
   }
   window.removeEventListener('sync-started', handleSyncStarted)
   window.removeEventListener('sync-completed', handleSyncCompleted)
})

const handleSyncStarted = () => {
   showSyncProgress.value = true
   syncStatus.value = 'เริ่มต้นการซิงค์...'
}

const handleSyncCompleted = async (event) => {
   const result = event.detail
   showSyncProgress.value = false

   if (result && result.synced > 0) {
      syncStatus.value = `ซิงค์สำเร็จ ${result.synced} รายการ`
   }

   await updatePendingCount()
}

watch(online, async (newValue, oldValue) => {
   if (oldValue !== undefined) { // ไม่แสดงครั้งแรก
      if (!newValue) {
         // เปลี่ยนเป็น offline
         showOffline.value = true
         showOnline.value = false
         showSyncProgress.value = false
      } else {
         // เปลี่ยนเป็น online
         showOffline.value = false
         showOnline.value = true

         // Auto sync เมื่อกลับมาออนไลน์
         setTimeout(async () => {
            window.dispatchEvent(new CustomEvent('sync-started'))
            const result = await syncService.syncToServer()
            window.dispatchEvent(new CustomEvent('sync-completed', { detail: result }))
         }, 1000)
      }
   }
})
</script>