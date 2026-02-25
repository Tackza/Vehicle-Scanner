<template>
   <v-container class="fill-height" fluid>
      <div class="otp-login">
         <h2>เข้าสู่ระบบ</h2>
         <form @submit.prevent="submitOtp">
            <label for="otp">กรอกรหัส 5 หลัก</label>
            <!-- <input id="otp" v-model="otp" maxlength="5" pattern="[0-9]{5}" required autocomplete="one-time-code"
               inputmode="numeric" /> -->
            <v-otp-input v-model="otp" type="number" masked length="5"></v-otp-input>
            <v-btn type="submit" color="primary">ยืนยัน</v-btn>
         </form>
         <v-snackbar v-model="snackbar" :timeout="2000">{{ snackbarText }}</v-snackbar>
      </div>
   </v-container>
</template>

<script setup>
import { ref } from 'vue'
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
   // OTP ถูกต้อง ไปหน้ากรอกข้อมูลส่วนตัว
   router.push({ name: 'OtpProfile', query: { otp: otp.value } })
}
</script>

<style scoped>
.otp-login {
   max-width: 400px;
   margin: 40px auto;
   padding: 24px;
   border-radius: 12px;
}

form {
   display: flex;
   flex-direction: column;
   gap: 16px;
}

input {
   font-size: 2rem;
   letter-spacing: 0.5rem;
   text-align: center;
   padding: 8px;
}
</style>
