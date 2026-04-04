<template>
   <v-container class="fill-height" fluid style="position: relative; min-height: 100vh;">
      <v-row align="center" justify="center">
         <v-col cols="12" class="text-center">
            <div class="minimal-spinner mx-auto mb-6"></div>
            <div style="font-size: 16px; font-weight: 600; color: var(--color-text);">กำลังประมวลผล</div>
            <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 6px;">กรุณารอสักครู่...</div>
         </v-col>
      </v-row>
      <v-row no-gutters style="position: absolute; left: 0; right: 0; bottom: 84px;">
         <v-col cols="12" class="text-center">
            <v-btn color="primary" @click="goToHistory">ไปหน้าประวัติ</v-btn>
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>
import { useGPS } from '@/services/gps'
import { useOCR } from '@/services/ocr'
import { useOnline } from '@/utils/offline'
import { ref } from 'vue'

import { useRouter } from 'vue-router'

const emit = defineEmits(['result', 'loading', 'manualInput'])

const cameraInput = ref(null)
const loading = ref(false)
const online = useOnline()
const { processImage } = useOCR()
const { getCurrentPosition } = useGPS()
const router = useRouter()

const openCamera = () => {
   cameraInput.value.click()
}

const goToHistory = () => {
   router.push({ name: 'history' })
}

const handleCapture = async (event) => {
   const file = event.target.files[0]
   if (!file) return

   loading.value = true
   emit('loading', true)

   try {
      const gps = await getCurrentPosition()
      const result = await processImage(file)
      emit('result', { ...result, gps })
   } catch (error) {
      console.error(error)
      emit('result', {
         success: false,
         requireManualInput: true,
         message: 'เกิดข้อผิดพลาด กรุณากรอกเอง'
      })
   } finally {
      loading.value = false
      emit('loading', false)
   }
}

const skipToManualInput = async () => {
   const gps = await getCurrentPosition()
   emit('manualInput', { gps })
}
</script>