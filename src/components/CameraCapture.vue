<template>
   <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-0">
               <v-card-text class="text-center">
                  <v-progress-circular indeterminate color="primary" size="80"
                     class="mx-auto mb-4"></v-progress-circular>
                  <v-card-title class="text-center">กำลังประมวลผล </v-card-title>
                  <p class="text-center mt-2">กรุณารอสักครู่</p>
               </v-card-text>
            </v-card>
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>
import { useGPS } from '@/services/gps'
import { useOCR } from '@/services/ocr'
import { useOnline } from '@/utils/offline'
import { ref } from 'vue'

const emit = defineEmits(['result', 'loading', 'manualInput'])

const cameraInput = ref(null)
const loading = ref(false)
const online = useOnline()
const { processImage } = useOCR()
const { getCurrentPosition } = useGPS()

const openCamera = () => {
   cameraInput.value.click()
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