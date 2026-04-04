<template>
   <v-dialog :model-value="modelValue" @update:model-value="val => emits('update:modelValue', val)" fullscreen
      persistent>
      <v-card class="camera-dialog-card">
         <div class="camera-container">
            <video ref="videoEl" autoplay playsinline muted class="camera-view" />
            <canvas ref="canvasEl" style="display:none" />

            <!-- 3x3 Grid Overlay -->
            <div class="grid-overlay">
               <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
               </div>
               <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
               </div>
               <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
               </div>
            </div>

            <div class="camera-controls">
               <v-btn class=" cancel-btn ma-2" color="red-lighten-2" icon="mdi-arrow-left" @click="closeDialog"></v-btn>

               <v-btn class="capture-btn ma-2" color="transparent" icon="mdi-camera" @click="capture">
                  <span class="capture-inner"></span>
               </v-btn>
               <v-btn icon disabled class="switch-btn ma-2" color="transparent" @click="switchCamera">
                  <v-icon size="30">mdi-camera-flip</v-icon>
               </v-btn>
            </div>
         </div>
      </v-card>
   </v-dialog>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps({
   modelValue: Boolean
})
const emits = defineEmits(['update:modelValue', 'capture', 'close'])

const videoEl = ref(null)
const canvasEl = ref(null)
const stream = ref(null)
const facingMode = ref('environment') // กล้องหลัง
const hasMultipleCameras = ref(false)

// ตรวจสอบจำนวนกล้อง
navigator.mediaDevices.enumerateDevices().then(devices => {
   const cameras = devices.filter(d => d.kind === 'videoinput')
   hasMultipleCameras.value = cameras.length > 1
})

const startCamera = async () => {
   try {
      // หยุด stream เก่าก่อน
      stopCamera()

      const constraints = {
         video: {
            facingMode: facingMode.value,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // ขอ resolution สูงสุดที่กล้องรองรับ
            advanced: [
               { width: 3840, height: 2160 }, // 4K
               { width: 1920, height: 1080 }, // 1080p
            ]
         },
         audio: false
      }

      stream.value = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoEl.value) {
         videoEl.value.srcObject = stream.value
      }
   } catch (err) {
      console.error('❌ Camera error:', err)
      // fallback ถ้าเปิดกล้องไม่ได้
      emits('update:modelValue', false)
   }
}

const stopCamera = () => {
   if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
   }
}

const capture = () => {
   const video = videoEl.value
   const canvas = canvasEl.value
   if (!video || !canvas) return

   canvas.width = video.videoWidth
   canvas.height = video.videoHeight

   const ctx = canvas.getContext('2d')
   ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

   canvas.toBlob((blob) => {
      if (blob) {
         const file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: 'image/jpeg'
         })
         emits('capture', file)
      }
   }, 'image/jpeg', 0.95)

   emits('update:modelValue', false)
}

const switchCamera = () => {
   facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
   startCamera()
}

const closeDialog = () => {
   stopCamera()
   emits('update:modelValue', false)
   emits('close')
}

// เปิด/ปิดกล้องตาม dialog state
watch(() => props.modelValue, (open) => {
   if (open) {
      // รอให้ DOM render ก่อน
      setTimeout(startCamera, 100)
   } else {
      stopCamera()
   }
})

onUnmounted(() => {
   stopCamera()
})
</script>

<style scoped>
.camera-dialog-card {
   width: 100vw;
   height: 100vh;
   background: #563dea;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   padding: 0;
}

.camera-container {
   position: relative;
   width: 100vw;
   height: 100vh;
   display: flex;
   align-items: center;
   justify-content: center;
   background: #563dea;
   overflow: hidden;
}

.camera-view {
   width: 100%;
   height: 100%;
   object-fit: cover;
}

.grid-overlay {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   display: flex;
   flex-direction: column;
   pointer-events: none;
}

.grid-row {
   flex: 1;
   display: flex;
   border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.grid-row:last-child {
   border-bottom: none;
}

.grid-cell {
   flex: 1;
   border-right: 2px solid rgba(255, 255, 255, 0.3);
}

.grid-cell:last-child {
   border-right: none;
}

.camera-controls {
   position: absolute;
   bottom: 0;
   left: 0;
   width: 100vw;
   display: flex;
   align-items: center;
   justify-content: center;
   pointer-events: none;
   gap: 68px;
   padding: 24px 48px;
   background: rgba(0, 0, 0, 0.8);
   backdrop-filter: blur(8px);
   border-radius: 0%;
}

.capture-btn,
.cancel-btn,
.switch-btn {
   pointer-events: auto;
}

.capture-inner {
   width: 64px;
   height: 64px;
   background: #e3e3e3;
   border-radius: 50%;
   display: block;
}

.cancel-btn,
.switch-btn {
   width: 56px;
   height: 56px;
   background: rgba(0, 0, 0, 0.5);
   border-radius: 50%;
}
</style>