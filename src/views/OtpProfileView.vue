<template>
   <v-container class="fill-height" fluid>

      <div class="profile-form">
         <h2 class='text-center mb-5'>กรอกข้อมูลเพื่อลงทะเบียน</h2>
         <form @submit.prevent="submitProfile">
            <v-text-field v-model="firstName" label="ชื่อ" required variant="outlined"></v-text-field>
            <v-text-field v-model="lastName" label="นามสกุล" required variant="outlined"></v-text-field>
            <v-text-field v-model="phone" label="เบอร์โทร" required maxlength="10" pattern="[0-9]{10}"
               inputmode="tel" variant="outlined"></v-text-field>
            <v-btn type="submit" color="primary">ยืนยันการลงทะเบียน</v-btn>
         </form>
         <v-snackbar v-model="snackbar" :timeout="2000">{{ snackbarText }}</v-snackbar>
      </div>
   </v-container>
</template>

<script setup>
import { loginWithOtp } from '@/services/api'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const otp = route.query.otp || ''
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const snackbar = ref(false)
const snackbarText = ref('')

async function submitProfile() {
   if (!firstName.value || !lastName.value || !/^\d{10}$/.test(phone.value)) {
      snackbarText.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
      snackbar.value = true
      return
   }
   try {
      await loginWithOtp({ otp, firstName: firstName.value, lastName: lastName.value, phone: phone.value })
      snackbarText.value = 'เข้าสู่ระบบสำเร็จ!'
      snackbar.value = true
      setTimeout(() => router.push({ name: 'Home' }), 1000)
   } catch (e) {
      snackbarText.value = 'เข้าสู่ระบบล้มเหลว กรุณาลองใหม่'
      snackbar.value = true
   }
}
</script>

<style scoped>
.profile-form {
   min-width: 330px;
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
</style>
