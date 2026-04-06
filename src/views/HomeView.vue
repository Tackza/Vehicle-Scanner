<!-- src/views/HomeView.vue -->
<template>
   <v-container class="fill-height" fluid style="background: var(--color-bg);">
      <!-- Offline Alert -->
      <div v-if="!online" class="mx-4 mb-4"
         style="background: var(--color-warning-light); border: 1px solid var(--color-warning-bg); border-radius: var(--radius-lg); padding: 16px 20px;">
         <div class="d-flex align-center" style="gap: 10px;">
            <v-icon size="20" color="#D97706">mdi-wifi-off</v-icon>
            <div>
               <div style="font-size: 15px; font-weight: 600; color: var(--color-text);">โหมดออฟไลน์</div>
               <div style="font-size: 13px; color: var(--color-text-secondary);">ไม่สามารถใช้ OCR อัตโนมัติได้
                  กรุณากรอกข้อมูลเอง</div>
            </div>
         </div>
      </div>

      <!-- Loading Overlay -->
      <v-overlay :model-value="loading" class="align-center justify-center" contained>
         <div class="text-center">
            <div class="minimal-spinner mx-auto mb-4"></div>
            <div style="font-size: 16px; font-weight: 600; color: white;">กำลังประมวลผล...</div>
         </div>
      </v-overlay>

      <CameraCapture @result="handleOCRResult" @manual-input="handleManualInputRequest" @loading="loading = $event" />

      <!-- Manual Input Dialog -->
      <ManualInput v-model="showManualInputDialog" :title="manualInputTitle" :message="manualInputMessage"
         :image="capturedImage" :gps="currentGPS" :initial-data="plateData" @submit="handleManualSubmit"
         @cancel="resetToCapture" @navigateHome="navigateHome" />
   </v-container>
</template>

<script setup>
import CameraCapture from '@/components/CameraCapture.vue'
import ManualInput from '@/components/ManualInput.vue'
import { useSnackbar } from '@/composables/snackbar'
import { db } from '@/db'
import { useOnline } from '@/utils/offline'
import { generateUID } from '@/utils/uid'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref('capture')
const loading = ref(false)
const showManualInputDialog = ref(false)
const plateData = ref(null)
const capturedImage = ref(null)
const currentGPS = ref(null)
const manualInputTitle = ref('กรอกข้อมูลป้ายทะเบียน')
const manualInputMessage = ref('')

const online = useOnline()
const { show: showSnackbar } = useSnackbar()

// Project info
const projectId = ref(null)

watch(showManualInputDialog, (newVal) => {
   if (newVal) {
      window.dispatchEvent(new CustomEvent('toggleNavBar', { detail: { hide: true } }))
   } else {
      window.dispatchEvent(new CustomEvent('toggleNavBar', { detail: { hide: false } }))
   }
})


onMounted(async () => {
   await fetchProject()
   if (!projectId.value) {
      // แจ้งเตือนและ redirect ไปหน้า Settingsถ้าไม่มีโครงการ
      showSnackbar('กรุณาตั้งค่าโครงการก่อนใช้งาน', 'error')
      router.push('/settings')
      return
   }
   window.addEventListener('cameraResult', handleCameraResultEvent)
   window.history.pushState({ preventBack: true }, '', window.location.href)
})

onUnmounted(() => {
   window.removeEventListener('cameraResult', handleCameraResultEvent)
})

const handleCameraResultEvent = (event) => {
   const result = event.detail
   handleOCRResult(result)
}

const handleOCRResult = (result) => {
   capturedImage.value = result.image
   currentGPS.value = result.gps

   if (result.success) {
      plateData.value = {
         plateNumber: result.plateNumber,
         province: result.province
      }
      manualInputTitle.value = 'อ่านป้ายทะเบียนสำเร็จ'
      manualInputMessage.value = 'กรุณาตรวจสอบข้อมูลและกรอกเลขสติกเกอร์'
      showManualInputDialog.value = true
   } else if (result.requireManualInput) {
      plateData.value = null
      manualInputTitle.value = result.offline
         ? 'ไม่มีอินเทอร์เน็ต'
         : 'ไม่สามารถอ่านป้ายทะเบียนได้'
      manualInputMessage.value = result.message
      showManualInputDialog.value = true
   }
}

const handleManualInputRequest = ({ gps }) => {
   currentGPS.value = gps
   plateData.value = null
   manualInputTitle.value = 'กรอกข้อมูลป้ายทะเบียน'
   manualInputMessage.value = ''
   showManualInputDialog.value = true
}


const handleManualSubmit = async (data) => {
   if (!projectId.value) {
      showSnackbar('ไม่พบโครงการที่ใช้งานอยู่ กรุณาตั้งค่าโครงการก่อน', 'error')
      router.push('/settings')
      return
   }
   setTimeout(async () => {
      await saveData(data)
   }, 2000);
}

const saveData = async (data) => {
   loading.value = true

   try {
      // ตรวจสอบ projectId ก่อนบันทึก
      if (!projectId.value) {
         showSnackbar('ไม่พบโครงการที่ใช้งานอยู่ กรุณาตั้งค่าโครงการก่อน', 'error')
         router.push('/settings')
         loading.value = false
         return
      }

      // ดึง user_id จาก localStorage ก่อน แล้ว fallback ไป userSession
      let userId = null

      // ลอง localStorage ก่อน
      const userIdData = localStorage.getItem('userId')
      if (userIdData) {
         try {
            const parsed = JSON.parse(userIdData)
            userId = parsed.userId
         } catch (e) {
            console.error('Error parsing userId from localStorage:', e)
         }
      }

      const cleanData = {
         uid: generateUID(),
         project_id: projectId.value,
         detect_plate_no: data.ocrData?.plateNumber || null,
         detect_plate_province: data.ocrData?.province || null,
         plate_no: data.plateNumber,
         plate_province: data.province || '',
         ocr_connected: online.value,
         is_manual: data.isEdited ? 1 : 0,
         photo_file: data.image,
         sticker_no: data.stickerNumber || '',
         lat: data.gps?.latitude || null,
         long: data.gps?.longitude || null,
         created_at: new Date().toISOString(),
         created_by: userId,
         synced: 0,
         timestamp: Date.now()
      }
      console.log('cleanData :>> ', cleanData);


      await db.scannedPlates.add(cleanData)

      showSnackbar('บันทึกสำเร็จ', 'success')
      resetToCapture()
   } catch (error) {
      console.error('Save error:', error)
      showSnackbar('เกิดข้อผิดพลาดในการบันทึก', 'error')
   } finally {
      loading.value = false
   }
}

// Fetch project info from API
// Fetch project info from local db
async function fetchProject() {
   try {
      const localProjects = await db.projects.toArray()
      if (localProjects.length > 0) {
         const project = localProjects[0]
         projectId.value = project.project_id
      } else {
         projectId.value = null
      }
   } catch (e) {
      projectId.value = null
   }
}

const navigateHome = () => {
   router.push('/')
}

const resetToCapture = () => {
   showManualInputDialog.value = false
   plateData.value = null
   capturedImage.value = null
   currentGPS.value = null
   router.push('/')
}


</script>
