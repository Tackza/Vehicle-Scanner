<template>
   <v-container class="px-5 pt-2">
      <!-- Stats Row -->
      <!-- <div class="d-flex mb-5" style="gap: 10px;">
         <div class="stat-box flex-grow-1">
            <div class="stat-box__label">วันนี้</div>
            <div class="stat-box__value" style="color: var(--color-text);">{{ todayCount }}</div>
         </div>
         <div class="stat-box flex-grow-1">
            <div class="stat-box__label">รอซิงค์</div>
            <div class="stat-box__value" style="color: var(--color-warning);">{{ unsyncedCount }}</div>
         </div>
         <div class="stat-box flex-grow-1">
            <div class="stat-box__label">สำเร็จ</div>
            <div class="stat-box__value" style="color: var(--color-success);">{{ syncedCount }}</div>
         </div>
      </div> -->

      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center py-8">
         <div class="minimal-spinner"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="empty-state">
         <v-icon size="56" class="empty-state__icon">mdi-inbox-outline</v-icon>
         <p class="empty-state__text">ยังไม่มีประวัติการสแกน</p>
      </div>

      <!-- History List -->
      <div v-else class="d-flex flex-column" style="gap: 8px;">
         <div v-for="item in items" :key="item.id" class="history-card" @click="openImageDialog(item.photo_file)">
            <!-- Thumbnail -->
            <div class="history-card__thumb">
               <template v-if="item.photo_file">
                  <img v-if="item.imageLoaded" :src="item.photo_file" alt="" />
                  <v-icon v-else size="22" color="#A8A29E">mdi-image-outline</v-icon>
                  <img v-if="!item.imageLoaded" :src="item.photo_file" style="display:none; position:absolute;"
                     @load="item.imageLoaded = true" />
               </template>
               <v-icon v-else size="22" color="#A8A29E">mdi-image-off-outline</v-icon>
            </div>

            <!-- Content -->
            <div style="flex: 1; min-width: 0;">
               <div class="d-flex align-center justify-space-between mb-1">
                  <span class="history-card__plate">
                     {{ item.plate_no || item.plateNumber }}
                  </span>
                  <span class="history-card__sticker">
                     #{{ item.sticker_no }}
                  </span>
               </div>
               <div class="d-flex align-center justify-space-between">
                  <span class="history-card__province text-truncate" style="max-width: 140px;">
                     {{ item.plate_province }}
                  </span>
                  <div class="d-flex align-center" style="gap: 6px;">
                     <span class="history-card__time">{{ formatTime(item.timestamp) }}</span>
                     <span class="sync-dot" :class="item.synced ? 'sync-dot--synced' : 'sync-dot--pending'"></span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Image Dialog -->
      <v-dialog v-model="imageDialog" max-width="600">
         <v-card style="border-radius: 16px; overflow: hidden; position: relative;">
            <v-card-text class="pa-0" style="position: relative;">
               <v-img :src="selectedImage" contain />
               <v-btn icon="mdi-close" variant="elevated" size="large" @click="imageDialog = false"
                  style="position: absolute; bottom: 8px; right: 8px; opacity: 0.8; transition: opacity 0.2s;"
                  @mouseenter="(e) => e.target.style.opacity = '0.8'"
                  @mouseleave="(e) => e.target.style.opacity = '0.5'" />
            </v-card-text>
         </v-card>
      </v-dialog>
   </v-container>
</template>

<script setup>
import { useSnackbar } from '@/composables/snackbar'
import { db } from '@/db'
import Dexie from 'dexie'
import { onMounted, ref } from 'vue'

const { show: showSnackbar } = useSnackbar()

const loading = ref(false)
const items = ref([])
const imageDialog = ref(false)
const selectedImage = ref('')
const projectId = ref(null)

// const unsyncedCount = computed(() => {
//    return items.value.filter((item) => item.synced === 0).length
// })

// const syncedCount = computed(() => {
//    return items.value.filter((item) => item.synced === 1).length
// })

// const todayCount = computed(() => {
//    const today = new Date()
//    today.setHours(0, 0, 0, 0)
//    return items.value.filter((item) => new Date(item.timestamp) >= today).length
// })

onMounted(async () => {
   await fetchProject()
   await loadData()
   window.addEventListener('successPopupClosed', () => {
      setTimeout(() => {
         loadData()
      }, 1500)
   })
})

const fetchProject = async () => {
   try {
      const localProjects = await db.projects.toArray()
      if (localProjects.length > 0) {
         projectId.value = localProjects[0].project_id
      } else {
         projectId.value = null
      }
   } catch (error) {
      console.error('Error fetching project:', error)
      projectId.value = null
   }
}

const loadData = async () => {
   loading.value = true
   try {
      if (!projectId.value) {
         items.value = []
         return
      }
      
      // 🚀 ใช้ compound index [project_id+timestamp] สำหรับ query ที่เร็ว
      const data = await db.scannedPlates
         .where('[project_id+timestamp]')
         .between(
            [projectId.value, Dexie.minKey],
            [projectId.value, Dexie.maxKey]
         )
         .reverse()
         .limit(6)
         .toArray()
      
      items.value = data.map(item => ({ ...item, imageLoaded: false }))
   } catch (error) {
      console.error('Load data error:', error)
      showSnackbar('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
   } finally {
      loading.value = false
   }
}

const formatTime = (date) => {
   return new Date(date).toLocaleString('th-TH', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
   })
}

const openImageDialog = (imageUrl) => {
   if (!imageUrl) return
   selectedImage.value = imageUrl
   imageDialog.value = true
}
</script>
