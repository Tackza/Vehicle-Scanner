<template>
   <v-container class="py-0">
      <v-card elevation="0">
         <v-card-text class="ma-0 pa-0">
            <!-- User Information -->
            <v-list v-if="userData" class="mb-1">
               <v-list-item>
                  <template v-slot:prepend>
                     <v-avatar color="primary">
                        <v-icon>mdi-account</v-icon>
                     </v-avatar>
                  </template>
                  <v-list-item-title>
                     {{ userData.firstName }} {{ userData.lastName }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                     @{{ userData.username }} 
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-if="userData.note" class="mt-1">
                     <v-chip size="x-small" color="info">{{ userData.note }}</v-chip>
                  </v-list-item-subtitle>
               </v-list-item>
            </v-list>

            <!-- Sync Status - 4 Boxes -->
            <v-row class="mb-3">
               <!-- <v-col cols="6" md="6">
                  <v-card variant="outlined" rounded="lg">
                     <v-card-title class="text-body-1">
                        จำนวน C7
                     </v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-info font-weight-bold">{{ registeredCount }}</div>
                     </v-card-text>
                  </v-card>
               </v-col> -->
               <v-col cols="12" md="6">
                  <v-card variant="outlined" rounded="lg" class="h-100">
                     <v-card-title class="text-body-1">
                        จำนวนสแกน
                     </v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-primary font-weight-bold">{{ scannedCount }}</div>
                     </v-card-text>
                  </v-card>
               </v-col>



               <v-col cols="6" md="6">
                  <v-card variant="outlined" rounded="lg">
                     <v-card-title class="text-body-1">
                        รอซิงค์
                     </v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-warning font-weight-bold">{{ unsyncedCount }}</div>

                     </v-card-text>
                  </v-card>
               </v-col>

               <v-col cols="6" md="6">
                  <v-card variant="outlined" class="h-100" rounded="lg">
                     <v-card-title class="text-body-1">

                        Sync ที่มีปัญหา
                     </v-card-title>
                     <v-card-text>
                        <div class="text-h4 text-error font-weight-bold">{{ syncErrorCount }}</div>

                     </v-card-text>
                  </v-card>
               </v-col>


            </v-row>

            <!-- Action Buttons -->
            <v-list>
               <v-divider class="my-2" />

               <v-list-item @click="syncNow">
                  <template v-slot:prepend>
                     <v-icon>mdi-sync</v-icon>
                  </template>
                  <v-list-item-title>ซิงค์ข้อมูลตอนนี้</v-list-item-title>
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
import { db, exportData as dbExportData } from '@/db'
import { syncService } from '@/services/sync'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { showSnackbar } = useSnackbar()

const userData = ref(null)
const scannedCount = ref(0)
// const syncedCount = ref(0)
const unsyncedCount = ref(0)
const syncErrorCount = ref(0)
// const registeredCount = ref(0)

onMounted(async () => {
   const session = await db.userSession.get(1)
   userData.value = session?.userData
   await loadStats()
})

const loadStats = async () => {
   scannedCount.value = await db.scannedPlates.count()
   // syncedCount.value = await db.scannedPlates.where('synced').equals(1).count()
   unsyncedCount.value = await db.scannedPlates.where('synced').equals(0).count()
   // registeredCount.value = await db.registeredVehicles.count()

   // Count sync errors from syncQueue (items with retryCount > 0 indicates error)
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
