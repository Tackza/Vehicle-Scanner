<template>
   <v-dialog :model-value="modelValue" @update:model-value="val => emits('update:modelValue', val)" fullscreen
      persistent>
      <v-card class="camera-dialog-card">
         <div class="camera-container">
            <video ref="videoEl" autoplay playsinline muted class="camera-view" />
            <canvas ref="canvasEl" style="display:none" />
            <div class="camera-controls">
               <v-btn icon class="cancel-btn" color="grey" @click="closeDialog">
                  <v-icon size="36">mdi-close-circle</v-icon>
               </v-btn>
               <v-btn class="capture-btn" color="transparent" icon @click="capture">
                  <span class="capture-inner"></span>
               </v-btn>
               <v-btn icon disabled class="switch-btn" color="grey" @click="switchCamera">
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

   // ใช้ resolution จริงจาก video stream
   canvas.width = video.videoWidth
   canvas.height = video.videoHeight

   const ctx = canvas.getContext('2d')
   ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

   // ส่งเป็น Blob คุณภาพสูง (quality 0.95)
   canvas.toBlob((blob) => {
      if (blob) {
         const file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: 'image/jpeg'
         })
         emits('capture', file)
         closeDialog()
      }
   }, 'image/jpeg', 0.95)
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
   background: #000;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   padding: 0;
   border-radius: 0;
}

.camera-container {
   position: relative;
   width: 100vw;
   height: 100vh;
   display: flex;
   align-items: center;
   justify-content: center;
   background: #000;
   overflow: hidden;
}

.camera-view {
   width: 100%;
   height: 100%;
   object-fit: cover;
}

.camera-controls {
   position: absolute;
   bottom: 48px;
   left: 0;
   width: 100vw;
   display: flex;
   align-items: center;
   justify-content: center;
   pointer-events: none;
   gap: 68px;
   padding: 0 48px;
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