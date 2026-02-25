<!-- src/views/HomeView.vue -->
<template>
   <v-container class="fill-height" fluid>
      <v-alert v-if="!online" type="warning" prominent border="start" class="mb-4">
         <v-row align="center">
            <v-col class="grow">
               <div class="text-h6">โหมดออฟไลน์</div>
               <div>ไม่สามารถใช้ OCR อัตโนมัติได้ กรุณากรอกข้อมูลเอง</div>
            </v-col>
         </v-row>
      </v-alert>

      <v-overlay :model-value="loading" class="align-center justify-center" contained>
         <v-progress-circular indeterminate size="64" color="primary" />
         <div class="mt-4 text-h6">กำลังประมวลผล...</div>
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
const { showSnackbar } = useSnackbar()

// ดูการเปลี่ยนแปลงของ showManualInputDialog เพื่อควบคุม navigation bar
watch(showManualInputDialog, (newVal) => {
   if (newVal) {
      // ซ่อน navigation bar เมื่อเปิด dialog
      window.dispatchEvent(new CustomEvent('toggleNavBar', { detail: { hide: true } }))
   } else {
      // แสดง navigation bar เมื่อปิด dialog
      window.dispatchEvent(new CustomEvent('toggleNavBar', { detail: { hide: false } }))
   }
})

onMounted(() => {
   // ฟัง event จาก App.vue เมื่อกดปุ่มสแกน
   window.addEventListener('cameraResult', handleCameraResultEvent)

   // ป้องกันการกดปุ่มย้อนกลับของ browser
   // เพิ่ม state ใหม่เข้า history เพื่อดัก popstate
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
      // OCR สำเร็จ - แสดงฟอร์มเพื่อกรอกเลขสติกเกอร์
      plateData.value = {
         plateNumber: result.plateNumber,
         province: result.province
      }
      manualInputTitle.value = '✓ อ่านป้ายทะเบียนสำเร็จ'
      manualInputMessage.value = 'กรุณาตรวจสอบข้อมูลและกรอกเลขสติกเกอร์'
      showManualInputDialog.value = true
   } else if (result.requireManualInput) {
      plateData.value = null
      manualInputTitle.value = result.offline
         ? '⚠️ ไม่มีอินเทอร์เน็ต'
         : '⚠️ ไม่สามารถอ่านป้ายทะเบียนได้'
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
   setTimeout(async () => {
      await saveData(data)
   }, 2000);
}

const saveData = async (data) => {
   loading.value = true

   try {
      // ดึง user.id จาก session
      const session = await db.userSession.get(1)

      // แปลง GPS เป็น plain object และ clean data
      const cleanData = {
         uid: generateUID(),
         project_id: 1, // กำหนด project_id เป็น 1 สำหรับตอนนี้
         // ข้อมูลที่ได้จาก OCR (ค่าเดิม)
         detect_plate_no: data.ocrData?.plateNumber || null,
         detect_plate_province: data.ocrData?.province || null,
         // ข้อมูลสุดท้ายที่บันทึก (อาจถูกแก้ไข)
         plate_no: data.plateNumber,
         plate_province: data.province || '',
         // สถานะการแก้ไข
         ocr_connected: !online.value,
         is_manual: data.isEdited ? 1 : 0,
         photo_file: data.image,
         sticker_no: data.stickerNumber || '',
         lat: data.gps?.latitude || null,
         long: data.gps?.longitude || null,
         created_at: Date.now(),
         created_by: session?.userData?.id || null,
         synced: 0,
         timestamp: Date.now()
      }

      // บันทึกลง IndexedDB
      await db.scannedPlates.add(cleanData)

      showSnackbar('✓ บันทึกสำเร็จ', 'success')
      resetToCapture()
   } catch (error) {
      console.error('Save error:', error)
      showSnackbar('เกิดข้อผิดพลาดในการบันทึก', 'error')
   } finally {
      loading.value = false
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
   // router.push('/') // Navigation now handled by navigateHome event
}

</script>