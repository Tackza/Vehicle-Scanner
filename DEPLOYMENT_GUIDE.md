# Firebase Deployment Guide

## สิ่งที่เตรียมเสร็จแล้ว ✅

1. **Removed ESLint formatting** - ลบการตั้งค่า ESLint ออก
2. **Created Firebase Cloud Function** - สร้าง `detectLicensePlate` function เพื่อเป็น proxy แบ่งไม่มี CORS issue
3. **Updated OCR service** - ปรับปรุง frontend ให้เรียก Cloud Function แทนการเรียก external API โดยตรง

## ขั้นตอนการ Deploy

### 1. Build สำหรับ Production
```bash
npm run build
```

### 2. Deploy ไป Firebase (Hosting + Functions)
```bash
firebase deploy
```

นี่จะ deploy ทั้ง:
- Frontend (Hosting)
- Backend Functions

### 3. ตรวจสอบผลลัพธ์
```bash
firebase functions:log
```

## URL ของ Cloud Function
```
https://asia-southeast1-mbus-v2.cloudfunctions.net/detectLicensePlate
```

## Architecture

### ก่อน (Direct API Call - CORS Issue)
```
Browser → Direct API → License Plate Service
```

### หลัง (Proxy via Cloud Functions - No CORS)
```
Browser → Cloud Functions (Proxy) → License Plate Service
```

## ข้อดี
✅ ไม่มี CORS issue  
✅ ความปลอดภัยดีขึ้น (API URL ซ่อนจาก client)  
✅ สามารถเพิ่ม authentication/logging ได้ง่าย  
✅ Control request timeout จาก backend  

## ถ้า Deploy ล้มเหลว

### Error: "Exceeded quota"
ตรวจสอบ Firebase plan - อาจต้องยังไม่ถึง Cloud Function hours

### Error: "CORS error"
ไม่ควรเกิดขึ้นอีก เพราะขณะนี้ function มี `cors: true`

### ต้องการเทสก่อน
```bash
npm --prefix functions serve
```

นี่จะรันฟังก์ชันในเครื่องก่อนอัปโหลด

---

**Project ID:** `mbus-v2`  
**Region:** `asia-southeast1`  
**Function Name:** `detectLicensePlate`
