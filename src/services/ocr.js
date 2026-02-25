// src/services/ocr.js
import { isOnline } from '@/utils/offline'

// ✅ เปลี่ยนจาก /detectLicensePlate เป็น / (root)
const OCR_URL = 'https://license-plate-service-833646348122.asia-southeast1.run.app/detect'

export const useOCR = () => {
   const processImage = async (imageFile) => {
      if (!isOnline()) {
         return {
            success: false,
            offline: true,
            requireManualInput: true,
            message: 'ไม่มีอินเทอร์เน็ต กรุณากรอกทะเบียนรถเอง',
            image: await fileToBase64(imageFile)
         }
      }

      try {
         console.log('🚀 Uploading to:', OCR_URL)
         console.log('   File:', imageFile.name)
         console.log('   Size (original):', imageFile.size, 'bytes')

         // ลดขนาดภาพให้ต่ำกว่า 800KB
         let processedFile = imageFile
         if (imageFile.size > 800 * 1024) {
            console.log('📦 Compressing image...')
            processedFile = await compressImage(imageFile, 800 * 1024) // 800KB
            console.log('   Size (compressed):', processedFile.size, 'bytes')
         }

         const formData = new FormData()
         formData.append('image', processedFile)

         const response = await fetch(OCR_URL, {
            method: 'POST',
            body: formData
         })

         console.log('📥 Response status:', response.status)

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ Error:', errorData)
            throw new Error(errorData.error || `HTTP ${response.status}`)
         }

         const data = await response.json()
         console.log('✅ Result:', data)

         if (!data.success) {
            throw new Error(data.error || 'OCR failed')
         }

         const plateNumber = data.data?.license_plate
         const province = data.data?.province

         // อ่านออกเสียงทะเบียนรถ
         if (plateNumber) {
            speakPlateNumber(plateNumber, province)
         }

         return {
            success: true,
            plateNumber: plateNumber,
            province: province,
            confidence: 0.9,
            image: await fileToBase64(processedFile)
         }

      } catch (error) {
         console.error('❌ OCR Error:', error)

         return {
            success: false,
            offline: false,
            requireManualInput: true,
            message: 'ไม่สามารถอ่านป้ายทะเบียนได้ กรุณากรอกเอง',
            error: error.message,
            image: await fileToBase64(imageFile)
         }
      }
   }

   return { processImage }
}

const fileToBase64 = (file) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
   })
}
// Helper: ลดขนาดภาพ
const compressImage = (file, maxSizeBytes) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
         const img = new Image()

         img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // คำนวณขนาดใหม่ โดยรักษาอัตราส่วน
            let width = img.width
            let height = img.height
            const maxDimension = 1280 // ลดจาก 1920 เป็น 1280

            if (width > height && width > maxDimension) {
               height = (height * maxDimension) / width
               width = maxDimension
            } else if (height > maxDimension) {
               width = (width * maxDimension) / height
               height = maxDimension
            }

            canvas.width = width
            canvas.height = height

            // วาดภาพใหม่
            ctx.drawImage(img, 0, 0, width, height)

            // ลดคุณภาพจนกว่าจะได้ขนาดที่ต้องการ
            let quality = 0.85 // ลดจาก 0.9 เป็น 0.85
            const tryCompress = () => {
               canvas.toBlob(
                  (blob) => {
                     if (!blob) {
                        reject(new Error('Failed to compress image'))
                        return
                     }

                     // ถ้าขนาดยังใหญ่เกินไป และ quality > 0.2 ให้ลดต่อ
                     if (blob.size > maxSizeBytes && quality > 0.2) {
                        quality -= 0.05 // ลดทีละ 5% แทน 10%
                        tryCompress()
                     } else {
                        // สร้าง File object ใหม่
                        const compressedFile = new File(
                           [blob],
                           file.name,
                           { type: 'image/jpeg' }
                        )
                        resolve(compressedFile)
                     }
                  },
                  'image/jpeg',
                  quality
               )
            }

            tryCompress()
         }

         img.onerror = () => reject(new Error('Failed to load image'))
         img.src = e.target.result
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
   })
}

// ฟังก์ชันอ่านออกเสียงทะเบียนรถ
const speakPlateNumber = (plateNumber, province) => {
   if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis API ไม่สนับสนุนในเบราว์เซอร์นี้')
      return
   }

   try {
      // ยกเลิกการอ่านออกเสียงที่คงค้างอยู่
      window.speechSynthesis.cancel()

      // สร้างข้อความที่จะอ่านออกเสียง
      let textToSpeak = `ทะเบียนรถ ${plateNumber}`
      if (province) {
         textToSpeak += ` ${province}`
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak)

      // ตั้งค่าเสียง
      utterance.lang = 'th-TH' // ภาษาไทย
      utterance.rate = 0.9 // ความเร็วในการพูด (0.1-10, ค่าเริ่มต้น 1)
      utterance.pitch = 1.0 // ระดับเสียง (0-2, ค่าเริ่มต้น 1)
      utterance.volume = 1.0 // ระดับเสียง (0-1, ค่าเริ่มต้น 1)

      console.log('🔊 พูด:', textToSpeak)
      window.speechSynthesis.speak(utterance)

      utterance.onend = () => {
         console.log('✅ อ่านออกเสียงเสร็จสิ้น')
      }

      utterance.onerror = (event) => {
         console.error('❌ เกิดข้อผิดพลาดในการอ่านออกเสียง:', event.error)
      }
   } catch (error) {
      console.error('❌ Error in speech synthesis:', error)
   }
}

