// src/services/gps.js
export const useGPS = () => {
   // ฟังก์ชันแจ้งเตือนผู้ใช้ให้เปิด GPS หรืออนุญาตการเข้าถึงตำแหน่ง
   const notifyEnableGPS = () => {
      alert('กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่งบนอุปกรณ์ของคุณ');
   }

   const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
         if (!navigator.geolocation) {
            alert('เบราว์เซอร์ของคุณไม่รองรับการใช้งาน GPS');
            resolve({ latitude: 0, longitude: 0, error: 'GPS not supported' })
            return
         }

         navigator.geolocation.getCurrentPosition(
            (position) => {
               resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: new Date()
               })
            },
            (error) => {
               console.warn('GPS Error:', error)
               // แจ้งเตือนเมื่อผู้ใช้ไม่อนุญาตหรือ GPS ไม่พร้อมใช้งาน
               if (error.code === 1 || error.code === 2) {
                  notifyEnableGPS();
               }
               resolve({
                  latitude: 0,
                  longitude: 0,
                  error: error.message
               })
            },
            {
               enableHighAccuracy: true,
               timeout: 5000,
               maximumAge: 0
            }
         )
      })
   }

   return { getCurrentPosition }
}