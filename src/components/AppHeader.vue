<template>
   <div class="text-center mb-6">
      <div
         style="width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
         <v-icon color="white" size="30" :key="currentIcon" class="icon-animate">{{ currentIcon }}</v-icon>
      </div>
      <div style="font-size: 22px; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
         Vehicle Scanner
      </div>
      <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px;">
         ระบบสแกนป้ายทะเบียน
      </div>
   </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const icons = ['mdi-camera', 'mdi-car', 'mdi-parking']
const currentIconIndex = ref(0)
const currentIcon = ref(icons[0])
let animationInterval = null

onMounted(() => {
   animationInterval = setInterval(() => {
      currentIconIndex.value = (currentIconIndex.value + 1) % icons.length
      currentIcon.value = icons[currentIconIndex.value]
   }, 2000)
})

onUnmounted(() => {
   if (animationInterval) {
      clearInterval(animationInterval)
   }
})
</script>

<style scoped>
.icon-animate {
   animation: iconFade 0.6s ease-in-out;
}

@keyframes iconFade {
   0% {
      opacity: 0;
      transform: scale(0.8) rotateY(90deg);
   }

   50% {
      opacity: 1;
   }

   100% {
      opacity: 1;
      transform: scale(1) rotateY(0deg);
   }
}
</style>
