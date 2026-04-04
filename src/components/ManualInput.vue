<template>
   <v-dialog v-model="dialogOpen" fullscreen transition="dialog-bottom-transition">
      <v-card style="background: var(--color-bg);">
         <v-card-text class="px-5 pt-8">
            <!-- Status badge -->
            <div v-if="initialData?.plateNumber" class="mb-5"
               style="background: var(--color-success-light); border: 1px solid var(--color-success-bg); border-radius: var(--radius-lg); padding: 16px 20px;">
               <div class="d-flex align-center mb-2" style="gap: 8px;">
                  <div
                     style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-success); display: flex; align-items: center; justify-content: center;">
                     <v-icon size="16" color="white">mdi-check</v-icon>
                  </div>
                  <span
                     style="font-size: 14px; font-weight: 600; color: var(--color-success);">อ่านป้ายทะเบียนสำเร็จ</span>
               </div>
               <div style="font-size: 24px; font-weight: 800; color: var(--color-text); letter-spacing: 0.03em;">
                  {{ initialData.plateNumber }}
               </div>
               <div v-if="initialData.province"
                  style="font-size: 14px; color: var(--color-text-secondary); margin-top: 2px;">
                  {{ initialData.province }}
               </div>
            </div>

            <!-- No OCR result -->
            <div v-else-if="message" class="mb-5"
               style="background: var(--color-warning-light); border: 1px solid var(--color-warning-bg); border-radius: var(--radius-lg); padding: 16px 20px;">
               <div class="d-flex align-center" style="gap: 8px;">
                  <v-icon size="20" color="#D97706">mdi-alert-circle-outline</v-icon>
                  <span style="font-size: 14px; font-weight: 500; color: var(--color-warning);">{{ message }}</span>
               </div>
            </div>

            <!-- Image Preview -->
            <div v-if="image" class="mb-5"
               style="border-radius: var(--radius-md); overflow: hidden; height: 160px; background: linear-gradient(135deg, #e8e6e3, #d6d3cf);">
               <v-img :src="image" cover height="160" />
            </div>

            <!-- Form -->
            <v-form ref="form" @submit.prevent="handleSubmit" class="minimal-form">
               <div class="mb-4">
                  <label
                     style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: 0.03em;">ทะเบียนรถ
                     *</label>
                  <v-text-field v-model="formData.plateNumber" placeholder="เช่น 1กก1234"
                     :rules="[rules.required, rules.noSpecialChars, rules.noSpaces]" @input="onPlateNumberInput"
                     hide-details="auto" density="comfortable" />
               </div>

               <div class="mb-4">
                  <label
                     style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: 0.03em;">จังหวัด</label>
                  <v-autocomplete v-model="formData.province" placeholder="ค้นหาจังหวัด" :items="provinces" clearable
                     hide-details="auto" density="comfortable" />
               </div>

               <div class="mb-4">
                  <label
                     style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: 0.03em;">เลขสติกเกอร์
                     *</label>
                  <v-text-field v-model="formData.stickerNumber" placeholder="เช่น 72"
                     :rules="[rules.required, rules.numeric]" type="number" min="1" step="1" @input="onStickerInput"
                     hide-details="auto" density="comfortable" />
               </div>
            </v-form>
         </v-card-text>

         <!-- Actions -->
         <v-card-actions class="px-5 pb-6 pt-2">
            <v-btn variant="outlined" @click="handleCancel" rounded="lg" size="large"
               style="flex: 1; font-weight: 600; border-color: var(--color-border); color: var(--color-text-secondary);">
               ยกเลิก
            </v-btn>
            <v-btn @click="handleSubmit" :loading="loading" :disabled="!isFormValid" rounded="lg" size="large"
               style="flex: 2; font-weight: 700; background-color: #563dea; color: #fff; border-color: #563dea;">
               บันทึก
            </v-btn>
         </v-card-actions>
      </v-card>
   </v-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { findClosestProvince } from '../utils/fuzzyMatchProvince';

const props = defineProps({
   modelValue: { type: Boolean, default: false },
   title: { type: String, default: 'กรอกข้อมูลป้ายทะเบียน' },
   message: String,
   image: String,
   gps: Object,
   initialData: Object
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const form = ref(null)
const loading = ref(false)
const dialogOpen = ref(props.modelValue)
const successTimeout = ref(null)

const provinces = [
   'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร',
   'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
   'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
   'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม',
   'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส',
   'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
   'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา',
   'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
   'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
   'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
   'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย',
   'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
   'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
   'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
   'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์',
   'อุทัยธานี', 'อุบลราชธานี', 'เบตง'
];

const formData = reactive({
   plateNumber: props.initialData?.plateNumber || '',
   province: props.initialData?.province || '',
   stickerNumber: '',
   note: ''
})

onMounted(() => {
   if (!formData.stickerNumber) {
      const lastSticker = localStorage.getItem('lastStickerNumber')
      if (lastSticker) {
         formData.stickerNumber = lastSticker
      }
   }
})

watch(() => props.initialData, (newInitialData) => {
   if (newInitialData) {
      formData.plateNumber = newInitialData.plateNumber || ''
      // Apply fuzzy matching to find the closest matching province
      if (newInitialData.province) {
         const matchedProvince = findClosestProvince(newInitialData.province, provinces)
         formData.province = matchedProvince
      } else {
         formData.province = ''
      }
   }
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
   dialogOpen.value = newVal
})

watch(dialogOpen, (newVal) => {
   emit('update:modelValue', newVal)
})

const rules = {
   required: (v) => !!v || 'กรุณากรอกข้อมูล',
   noSpecialChars: (v) => !/[!@#$%^&*()_+=\[\]{};':",.<>?/\\|`~]/.test(v) || 'ห้ามใส่สัญลักษณ์พิเศษ',
   noSpaces: (v) => !/\s/.test(v) || 'ห้ามเว้นวรรค',
   numeric: (v) => (/^\d+$/.test(v) ? true : 'กรอกเฉพาะตัวเลข')
}

const isFormValid = computed(() => {
   const plateValid = formData.plateNumber &&
      rules.required(formData.plateNumber) === true &&
      rules.noSpecialChars(formData.plateNumber) === true &&
      rules.noSpaces(formData.plateNumber) === true

   const stickerValid = formData.stickerNumber &&
      rules.required(formData.stickerNumber) === true &&
      rules.numeric(formData.stickerNumber) === true

   return plateValid && stickerValid
})

function onPlateNumberInput(e) {
   if (typeof formData.plateNumber === 'string') {
      formData.plateNumber = formData.plateNumber.replace(/[^ก-ฮ0-9]/g, '')
   }
}

function onStickerInput(e) {
   if (typeof formData.stickerNumber === 'string') {
      formData.stickerNumber = formData.stickerNumber.replace(/\D/g, '')
   }
}

const handleSubmit = async () => {
   const { valid } = await form.value.validate()
   if (!valid) return

   loading.value = true
   const initialPlateNumber = props.initialData?.plateNumber || ''
   const initialProvince = props.initialData?.province || ''

   const isEdited = props.initialData
      ? (formData.plateNumber.trim() !== initialPlateNumber ||
         formData.province.trim() !== initialProvince)
      : true

   emit('submit', {
      ...formData,
      plateNumber: formData.plateNumber.trim(),
      province: formData.province.trim(),
      gps: props.gps,
      image: props.image,
      manualEntry: true,
      ocrData: props.initialData ? {
         plateNumber: props.initialData.plateNumber || '',
         province: props.initialData.province || ''
      } : null,
      isEdited: isEdited
   })

   let nextSticker = parseInt(formData.stickerNumber, 10)
   if (!isNaN(nextSticker)) {
      nextSticker++
      localStorage.setItem('lastStickerNumber', String(nextSticker))
   } else {
      nextSticker = ''
   }

   loading.value = false

   window.dispatchEvent(new CustomEvent('showSuccessPopup'))
   emit('navigateHome')
   successTimeout.value = setTimeout(() => {
      dialogOpen.value = false
      formData.stickerNumber = nextSticker ? String(nextSticker) : ''
   }, 2000)
}

const handleCancel = async () => {
   dialogOpen.value = false
   emit('cancel')
}
</script>
