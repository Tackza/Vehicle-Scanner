<template>
   <v-container>
      <v-card elevation="0">
         <!-- <v-card-title class="d-flex align-center mb-5">
            <v-icon left>mdi-history</v-icon>
            ประวัติการสแกน
            <v-spacer />
            <v-chip :color="unsyncedCount > 0 ? 'warning' : 'success'" size="small">
               รอซิงค์: {{ unsyncedCount }}
            </v-chip>
         </v-card-title> -->

         <v-card-text class="ma-0 pa-0">
            <!-- Loading -->
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <!-- No Data -->
            <div v-if="!loading && items.length === 0" class="text-center py-8">
               <v-icon size="64" color="grey">mdi-inbox</v-icon>
               <p class="text-grey mt-2">ไม่พบข้อมูล</p>
            </div>

            <!-- Card List -->
            <div v-else>
               <v-card v-for="item in items" :key="item.id" class="mb-1" elevation="0" variant="flat"
                  style="border-radius: 12px; border-color: gray;">
                  <div class="d-flex">
                     <!-- Image Thumbnail -->
                     <div class="pa-2 align-center d-flex justify-center">
                        <div class="" style="width: 100px; height: 100px;">
                           <template v-if="item.photo_file">
                              <v-skeleton-loader v-if="!item.imageLoaded" type="image" height="100" class="rounded-lg"
                                 style="width: 100px; height: 100px;" />
                              <v-img v-if="item.imageLoaded" :src="item.photo_file" cover height="100"
                                 class="rounded-lg" style="cursor: pointer;"
                                 @click="openImageDialog(item.photo_file)" />
                              <img v-if="!item.imageLoaded" :src="item.photo_file" style="display:none"
                                 @load="item.imageLoaded = true" />
                           </template>
                           <div v-else class="bg-grey-lighten-3 d-flex align-center justify-center"
                              style="height: 100px;">
                              <v-icon size="38" color="grey-lighten-1">mdi-image-off</v-icon>
                           </div>
                        </div>
                     </div>

                     <!-- Content -->
                     <div class="flex-grow-1 d-flex flex-column">
                        <v-card-text class="pa-3 flex-grow-1">
                           <div class="d-flex align-center justify-space-between mb-3">
                              <!-- <v-icon :color="item.manualEntry ? 'orange' : 'primary'" size="small" class="mr-2">
                                 {{ item.manualEntry ? 'mdi-keyboard' : 'mdi-camera' }}
                              </v-icon> -->
                              <div>
                                 <p class="text-subtitle-1 pb-0 font-weight-bold">{{ item.plate_no || item.plateNumber
                                    }}
                                 </p>
                                 <p class="text-subtitle-2 font-weight-bold text-medium-emphasis text-truncate">{{
                                    item.plate_province }}
                                 </p>
                              </div>

                              <!-- <v-icon size="x-small" class="mr-1" color="primary">mdi-sticker</v-icon> -->
                              <span class="font-weight-bold text-body-2">{{ item.sticker_no }}</span>
                           </div>



                           <div class="text-body-2 d-flex justify-space-between align-center">

                              <span class="text-grey text-caption">{{ formatDate(item.timestamp) }}</span>
                              <v-spacer />
                              <v-chip :color="item.synced ? 'success' : 'warning'" size="x-small" variant="flat">
                                 {{ item.synced ? 'ซิงค์แล้ว' : 'รอซิงค์' }}
                              </v-chip>
                           </div>
                        </v-card-text>

                        <!-- Actions -->
                        <!-- <v-card-actions class="pa-2 pt-0">
                           <v-btn variant="text" size="x-small" color="primary" @click="viewDetails(item)">
                              <v-icon size="small">mdi-eye</v-icon>
                           </v-btn>
                           <v-btn variant="text" size="x-small" color="error" @click="deleteItem(item)">
                              <v-icon size="small">mdi-delete</v-icon>
                           </v-btn>
                        </v-card-actions> -->
                     </div>
                  </div>
               </v-card>
            </div>
         </v-card-text>
      </v-card>

      <!-- Image Dialog -->
      <v-dialog v-model="imageDialog" max-width="800">
         <v-card>

            <v-card-text class="pa-0">
               <v-img :src="selectedImage" contain />
            </v-card-text>
         </v-card>
         <!-- <v-btn icon size="small" @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
         </v-btn> -->
      </v-dialog>
   </v-container>
</template>

<script setup>
import { useSnackbar } from '@/composables/snackbar'
import { db } from '@/db'
import { computed, onMounted, ref } from 'vue'

const { showSnackbar } = useSnackbar()

const loading = ref(false)
const items = ref([])
const imageDialog = ref(false)
const selectedImage = ref('')


const unsyncedCount = computed(() => {
   return items.value.filter((item) => item.synced === 0).length
})

onMounted(async () => {
   await loadData()
   // await loadData() // Moved to successPopup event handler
   // Listen for successPopup close event
   window.addEventListener('successPopupClosed', () => {
      setTimeout(() => {
         loadData()
      }, 1500)
   })
})

const loadData = async () => {
   loading.value = true
   try {
      const data = await db.scannedPlates.orderBy('timestamp').reverse().limit(5).toArray()
      // เพิ่ม property imageLoaded สำหรับแต่ละ item
      items.value = data.map(item => ({ ...item, imageLoaded: false }))
   } catch (error) {
      console.error('Load data error:', error)
      showSnackbar('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
   } finally {
      loading.value = false
   }
}

// In App.vue, after successPopup.value = false, dispatch event for listeners
// window.dispatchEvent(new CustomEvent('successPopupClosed'))

const formatDate = (date) => {
   return new Date(date).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
   })
}

const viewDetails = (item) => {
   alert(JSON.stringify(item, null, 2))
}

const deleteItem = async (item) => {
   if (!confirm(`ต้องการลบทะเบียน ${item.plate_no || item.plateNumber} ?`)) return

   try {
      await db.scannedPlates.delete(item.id)
      await loadData()
      showSnackbar('ลบข้อมูลสำเร็จ', 'success')
   } catch (error) {
      console.error('Delete error:', error)
      showSnackbar('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
   }
}

const openImageDialog = (imageUrl) => {
   selectedImage.value = imageUrl
   imageDialog.value = true
}
</script>