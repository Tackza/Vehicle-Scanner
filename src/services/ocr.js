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
         console.log('   File:', imageFile.name)
         console.log('   Size (original):', imageFile.size, 'bytes')

         // ลดขนาดภาพให้ต่ำกว่า 50KB
         let processedFile = imageFile;
         if (imageFile.size > 50 * 1024) {
            console.log('📦 Resizing image to <50KB...');
            let quality = 0.9;
            let resizedFile = imageFile;
            // ลดขนาดภาพและคุณภาพจนกว่าจะต่ำกว่า 50KB หรือ quality ต่ำสุด
            do {
               resizedFile = await resizeImage(resizedFile, {
                  maxWidth: 800,
                  maxHeight: 800,
                  mimeType: 'image/jpeg',
                  quality: quality
               });
               quality -= 0.05;
            } while (resizedFile.size > 50 * 1024 && quality >= 0.3);
            processedFile = resizedFile;
            console.log('   Size (resized):', processedFile.size, 'bytes');
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
// Helper: ลดขนาดภาพแบบตั้งค่าได้
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1000;
const MIME_TYPE = "image/jpeg";
const QUALITY = 0.9;

export const resizeImage = (file, options = {}) => {
   const maxWidth = options.maxWidth || MAX_WIDTH;
   const maxHeight = options.maxHeight || MAX_HEIGHT;
   const mimeType = options.mimeType || MIME_TYPE;
   const quality = options.quality || QUALITY;

   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
         const img = new Image();
         img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
               if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
               }
            } else {
               if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
               }
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
               if (!blob) {
                  reject(new Error("Failed to resize image"));
                  return;
               }
               const resizedFile = new File([blob], `resized_${file.name}`, { type: mimeType });
               resolve(resizedFile);
            }, mimeType, quality);
         };
         img.onerror = () => reject(new Error("Failed to load image"));
         img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
   });
};

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

