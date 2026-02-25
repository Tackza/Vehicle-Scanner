<template>
   <v-dialog v-model="dialogOpen" fullscreen transition="dialog-bottom-transition">
      <v-card>
         <!-- Dialog Content -->
         <v-card-text class="mt-6">
            <!-- Title -->
            <!-- <div class="text-h5 font-weight-bold text-center mb-2">
               {{ title }}
            </div> -->

            <!-- Message -->
            <v-card-subtitle v-if="message" class="text-subtitle-2 text-center mb-4">
               {{ message }}
            </v-card-subtitle>

            <!-- Image Preview -->
            <v-img v-if="image" :src="image" class="mb-6 rounded" max-height="200" cover />

            <!-- OCR Result Display -->
            <!-- <v-alert v-if="initialData?.plateNumber || initialData?.province" type="success" density="comfortable"
               class="mb-6" border="start">
               <div class="d-flex align-center gap-2 mb-2">
                  <v-icon>mdi-check-circle</v-icon>
                  <span class="text-subtitle-1 font-weight-bold">ผลการอ่านป้ายทะเบียน</span>
               </div>
               <div v-if="initialData?.plateNumber" class="mb-2 ml-7">
                  <strong>เลขทะเบียน:</strong>
                  <span class="text-h6 text-primary ml-2">{{ initialData.plateNumber }}</span>
               </div>
               <div v-if="initialData?.province" class="ml-7">
                  <strong>จังหวัด:</strong>
                  <span class="text-subtitle-2 text-primary ml-2">{{ initialData.province }}</span>
               </div>
            </v-alert> -->

            <!-- Form -->
            <v-form ref="form" @submit.prevent="handleSubmit">
               <v-text-field v-model="formData.plateNumber" label="ทะเบียนรถ *" placeholder="เช่น 1กก1234 "
                  variant="outlined" :rules="[rules.required, rules.noSpecialChars, rules.noSpaces]"
                  @input="onPlateNumberInput" />

               <v-autocomplete v-model="formData.province" label="จังหวัด" placeholder="ค้นหาจังหวัด" variant="outlined"
                  class="mt-3" :items="provinces" clearable />


               <v-text-field v-model="formData.stickerNumber" label="เลขสติกเกอร์ *" variant="outlined" class="mt-3"
                  :rules="[rules.required, rules.numeric]" type="number" min="1" step="1" @input="onStickerInput" />
            </v-form>
         </v-card-text>

         <!-- Dialog Actions -->
         <v-card-actions class="pa-4">
            <v-btn color="grey" variant="outlined" @click="handleCancel" width="120">
               <v-icon left>mdi-close</v-icon>
               ยกเลิก
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="elevated" @click="handleSubmit" :loading="loading" :disabled="!isFormValid"
               width="120">
               <v-icon left>mdi-check</v-icon>
               บันทึก
            </v-btn>
         </v-card-actions>
      </v-card>
   </v-dialog>

   <!-- Success Popup moved to App.vue -->
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps({
   modelValue: { type: Boolean, default: false },
   title: { type: String, default: 'กรอกข้อมูลป้ายทะเบียน' },
   message: String,
   image: String,
   gps: Object,
   initialData: Object
})
console.log('props :>> ', props);

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const form = ref(null)
const loading = ref(false)
const dialogOpen = ref(props.modelValue)
const successPopup = ref(false)
const successTimeout = ref(null)

const playSuccessSound = () => {
   const audio = new Audio('/success.mp3') // ใช้ไฟล์เสียงจาก public
   audio.play()
}

// List of Thai provinces
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
   // Load lastStickerNumber from localStorage if not set
   if (!formData.stickerNumber) {
      const lastSticker = localStorage.getItem('lastStickerNumber')
      console.log('lastSticker :>> ', lastSticker);
      if (lastSticker) {
         formData.stickerNumber = lastSticker
      }
   }
})

// Update formData when initialData changes
watch(() => props.initialData, (newInitialData) => {
   if (newInitialData) {
      formData.plateNumber = newInitialData.plateNumber || ''
      formData.province = newInitialData.province || ''

   }
}, { deep: true })

// Sync dialog state
watch(() => props.modelValue, (newVal) => {
   dialogOpen.value = newVal
})

watch(dialogOpen, (newVal) => {
   emit('update:modelValue', newVal)
})

const rules = {
   required: (v) => !!v || 'กรุณากรอกข้อมูล',
   plateFormat: (v) => {
      const patterns = [
         /^[0-9][ก-ฮ]{2}[0-9]{1,4}$/,
         /^[ก-ฮ]{2}-?[0-9]{1,4}$/,
         /^[A-Z]{2,3}[0-9]{1,4}$/
      ]
      return patterns.some((p) => p.test(v)) || 'รูปแบบทะเบียนไม่ถูกต้อง'
   },
   noSpecialChars: (v) => !/[!@#$%^&*()_+=\[\]{};':",.<>?/\\|`~]/.test(v) || 'ห้ามใส่สัญลักษณ์พิเศษ',
   noSpaces: (v) => !/\s/.test(v) || 'ห้ามเว้นวรรค',
   numeric: (v) => (/^\d+$/.test(v) ? true : 'กรอกเฉพาะตัวเลข')
}

// Computed property to check if form is valid
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
   // Allow only Thai characters (ก-ฮ) and numbers (0-9)
   if (typeof formData.plateNumber === 'string') {
      formData.plateNumber = formData.plateNumber.replace(/[^ก-ฮ0-9]/g, '')
   }
}

function onStickerInput(e) {
   // Remove non-numeric characters if pasted
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

   // เช็คว่ามีการแก้ไขข้อมูลหรือไม่
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
      // ส่งข้อมูล OCR เดิมด้วย
      ocrData: props.initialData ? {
         plateNumber: props.initialData.plateNumber || '',
         province: props.initialData.province || ''
      } : null,
      isEdited: isEdited
   })

   // Auto-increment stickerNumber for next entry if it's a valid number
   let nextSticker = parseInt(formData.stickerNumber, 10)
   if (!isNaN(nextSticker)) {
      nextSticker++
      localStorage.setItem('lastStickerNumber', String(nextSticker))
   } else {
      nextSticker = ''
   }

   loading.value = false

   // Show global success popup
   window.dispatchEvent(new CustomEvent('showSuccessPopup'))
   emit('navigateHome') // Emit event to navigate immediately
   successTimeout.value = setTimeout(() => {
      dialogOpen.value = false
      // Set stickerNumber for next entry (if dialog is opened again)
      formData.stickerNumber = nextSticker ? String(nextSticker) : ''
   }, 2000)
}

const handleCancel = async () => {
   dialogOpen.value = false
   emit('cancel')
}
</script>