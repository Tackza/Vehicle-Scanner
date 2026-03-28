<template>
   <v-container class="fill-height" fluid style="background: var(--color-bg);">
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4" style="max-width: 380px;">
            <!-- Logo -->
            <div class="text-center mb-10">
               <div
                  style="width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <v-icon color="white" size="30">mdi-lock-outline</v-icon>
               </div>
               <div style="font-size: 22px; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
                  Vehicle Scanner
               </div>
               <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px;">
                  ระบบสแกนป้ายทะเบียน
               </div>
            </div>

            <!-- Message -->
            <div class="text-center mb-8">
               <div style="font-size: 18px; font-weight: 700; color: var(--color-text); margin-bottom: 12px;">
                  กรุณาเข้าระบบด้วยการ scan QR code
               </div>
               <!-- <div style="font-size: 14px; color: var(--color-text-tertiary); line-height: 1.5;">
                  คุณต้องเข้าสู่ระบบเพื่อใช้งาน
               </div> -->
            </div>

            <!-- Buttons -->
            <!-- <div class="mb-4">
               <v-btn 
                  color="#1C1917" 
                  block 
                  size="large" 
                  rounded="lg"
                  style="font-weight: 700; font-size: 16px;"
                  @click="goToQrLogin"
               >
                  <v-icon start>mdi-qrcode-scan</v-icon>
                  Scan QR Code
               </v-btn>
            </div>

            <div class="text-center">
               <span style="font-size: 14px; color: var(--color-text-secondary);">หรือ</span>
            </div>

            <div class="mt-4">
               <v-btn 
                  variant="outlined"
                  color="var(--color-text-secondary)"
                  block 
                  size="large" 
                  rounded="lg"
                  style="font-weight: 700; font-size: 16px;"
                  @click="goToLogin"
               >
                  <v-icon start>mdi-login</v-icon>
                  เข้าสู่ระบบด้วยชื่อผู้ใช้
               </v-btn>
            </div> -->
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>
// import { useRouter } from 'vue-router'

// const router = useRouter()

// function goToQrLogin() {
//    router.push({ name: 'OtpProfile' })
// }

// function goToLogin() {
//    router.push({ name: 'login' })
// }
</script>
