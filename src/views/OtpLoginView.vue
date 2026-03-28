<template>
   <v-container class="fill-height" fluid style="background: var(--color-bg);">
      <v-row align="center" justify="center">
         <v-col cols="12" sm="8" md="4" style="max-width: 380px;">
            <!-- Logo -->
            <div class="text-center mb-10">
               <div
                  style="width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <v-icon color="white" size="30">mdi-shield-key-outline</v-icon>
               </div>
               <div style="font-size: 20px; font-weight: 800; color: var(--color-text);">เข้าสู่ระบบ</div>
               <div style="font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px;">กรอกรหัส OTP 5 หลัก
               </div>
            </div>

            <form @submit.prevent="submitOtp" class="minimal-form">
               <v-otp-input v-model="otp" type="number" length="5" class="mb-6"></v-otp-input>

               <v-btn type="submit" color="#1C1917" block size="large" rounded="lg"
                  style="font-weight: 700; font-size: 16px;">
                  ยืนยัน
               </v-btn>
            </form>

            <v-snackbar v-model="snackbar" :timeout="2000" rounded="lg">{{ snackbarText }}</v-snackbar>
         </v-col>
      </v-row>
   </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const otp = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const router = useRouter()

function submitOtp() {
   if (otp.value.length !== 5 || !/^[0-9]{5}$/.test(otp.value)) {
      snackbarText.value = 'กรุณากรอก OTP 5 หลัก'
      snackbar.value = true
      return
   }
   router.push({ name: 'OtpProfile', query: { otp: otp.value } })
}

onMounted(() => {
   const loginData = localStorage.getItem('loginData')
   if (loginData) {
      router.replace({ name: 'history' })
   }
})
</script>
