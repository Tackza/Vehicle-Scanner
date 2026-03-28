<template>
   <v-snackbar v-model="showOffline" :timeout="-1" color="#D97706" location="top" rounded="lg">
      <div class="d-flex align-center" style="gap: 10px;">
         <v-icon size="20">mdi-wifi-off</v-icon>
         <div>
            <div style="font-weight: 600; font-size: 14px;">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</div>
            <div style="font-size: 12px; opacity: 0.85;">ข้อมูลจะซิงค์เมื่อกลับมาออนไลน์</div>
         </div>
      </div>

      <template v-slot:actions>
         <v-btn size="small" variant="text" @click="showOffline = false">ปิด</v-btn>
      </template>
   </v-snackbar>

   <v-snackbar v-model="showOnline" :timeout="3000" color="#16A34A" location="top" rounded="lg">
      <div class="d-flex align-center" style="gap: 10px;">
         <v-icon size="20">mdi-wifi</v-icon>
         <div style="font-weight: 600; font-size: 14px;">เชื่อมต่ออินเทอร์เน็ตแล้ว</div>
      </div>
   </v-snackbar>

   <!-- Sync Progress -->
   <v-snackbar v-model="showSyncProgress" :timeout="-1" color="#1C1917" location="bottom" rounded="lg">
      <div class="d-flex align-center" style="gap: 10px;">
         <v-progress-circular indeterminate size="18" width="2" color="white" />
         <span style="font-size: 14px; font-weight: 500;">กำลังซิงค์ข้อมูล...</span>
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
const pendingCount = ref(0)

let syncStatsInterval = null

const updatePendingCount = async () => {
   const stats = await getSyncStats()
   pendingCount.value = stats.pending
}

onMounted(() => {
   updatePendingCount()
   syncStatsInterval = setInterval(updatePendingCount, 5000)
   window.addEventListener('sync-started', handleSyncStarted)
   window.addEventListener('sync-completed', handleSyncCompleted)
})

onUnmounted(() => {
   if (syncStatsInterval) clearInterval(syncStatsInterval)
   window.removeEventListener('sync-started', handleSyncStarted)
   window.removeEventListener('sync-completed', handleSyncCompleted)
})

const handleSyncStarted = () => {
   showSyncProgress.value = true
}

const handleSyncCompleted = async () => {
   showSyncProgress.value = false
   await updatePendingCount()
}

watch(online, async (newValue, oldValue) => {
   if (oldValue !== undefined) {
      if (!newValue) {
         showOffline.value = true
         showOnline.value = false
         showSyncProgress.value = false
      } else {
         showOffline.value = false
         showOnline.value = true

         setTimeout(async () => {
            window.dispatchEvent(new CustomEvent('sync-started'))
            const result = await syncService.syncToServer()
            window.dispatchEvent(new CustomEvent('sync-completed', { detail: result }))
         }, 1000)
      }
   }
})
</script>
