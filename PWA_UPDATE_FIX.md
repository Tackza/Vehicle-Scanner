# 🔧 PWA Update & Cache Fix Guide

## ปัญหาที่แก้ไข

### 1. **Service Worker Cache ไม่ Update** ❌

**ปัญหา:** Cache version คงที่ `'vehicle-scanner-v1'` ทำให้ service worker ไม่สามารถลบ cache เก่าได้

**แก้ไข:**

- เปลี่ยนเป็น dynamic version ที่มี timestamp: `const CACHE_VERSION = 'vehicle-scanner-${Date.now()}'`
- ทุกครั้งที่ deploy ใหม่ จะสร้าง cache name ใหม่
- Service worker activation จะลบ cache รุ่นเก่าโดยอัตโนมัติ

### 2. **Firebase Hosting Cache Headers ขาด** 📋

**ปัญหา:** ไม่มีการกำหนด cache control headers ใน `firebase.json`

**แก้ไข:** เพิ่ม headers configuration:

```json
"headers": [
  {
    "source": "index.html",
    "headers": [{
      "key": "Cache-Control",
      "value": "public, max-age=0, must-revalidate"  // ไม่ cache
    }]
  },
  {
    "source": "**/*.js",
    "headers": [{
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"  // cache 1 ปี
    }]
  }
]
```

### 3. **Vite PWA ไม่บังคับ Update** 🔄

**ปัญหา:** ใช้ `registerType: 'autoUpdate'` แต่ไม่มี `skipWaiting` และ `clientsClaim`

**แก้ไข:**

```javascript
VitePWA({
  registerType: 'prompt', // เปลี่ยนให้ prompt ผู้ใช้
  strategies: 'injectManifest',
  workbox: {
    skipWaiting: true, // ข้ามรอให้ clients ปิด
    clientsClaim: true, // ยึดควบคุมทุก clients
    cleanupOutdatedCaches: true,
  },
})
```

### 4. **ไม่มีการแจ้งเตือน Update ให้ผู้ใช้** 📱

**ปัญหา:** มีเวอร์ชั่นใหม่ แต่ผู้ใช้ไม่รู้

**แก้ไข:** สร้าง PWA update handler `src/utils/pwaUpdate.js`:

- เช็ค service worker updates ทุก 30 วินาที
- แสดง snackbar notification เมื่อมี new version
- ให้ผู้ใช้เลือก "อัพเดท" หรือ "ยกเลิก"

## 🚀 วิธี Deploy

### Step 1: Build & Deploy

```bash
npm run build
```

หมายเหตุ: `package.json` มีคำสั่ง: `"build": "vite build && firebase deploy --only hosting"`

### Step 2: Clear Browser Cache (ทีมทดสอบ)

บนมือถือ หลังจาก deploy:

**iPhone/Safari:**

1. Settings > Safari
2. Advanced > Website Data
3. ลบ domain ของเรา

**Android/Chrome:**

1. Chrome Settings
2. Privacy > Clear browsing data
3. เลือก "All time"
4. ✓ Cookies and site data

### Step 3: ทดสอบ Update

1. เปิดแอป บน 2 มือถือต่างกัน
2. Deploy version ใหม่
3. รอ 30 วินาที - จะเห็น notification "มีเวอร์ชั่นใหม่พร้อม"
4. แตะ "อัพเดท" → reload หน้าใหม่

## 📊 ผลการแก้ไข

| ปัญหา               | ก่อน         | หลัง                 |
| ------------------- | ------------ | -------------------- |
| Cache invalidation  | ❌ Never     | ✅ On deploy         |
| Browser cache       | ❌ Unlimited | ✅ Always revalidate |
| Update notification | ❌ None      | ✅ Prompt user       |
| Check frequency     | 1 min        | 30 sec               |
| Force update?       | ❌ No        | ✅ Yes               |

## 🔍 Monitoring

ดู browser DevTools:

1. **Application > Cache Storage**: ดูรุ่น cache
2. **Application > Service Workers**: ดูสถานะ
3. **Console**: ดู log `[SW]` messages

## ⚠️ หากยังไม่ update

ให้ลองลบ cache ของ index.html:

```javascript
// Run ใน browser console
caches.delete('vehicle-scanner-runtime')
caches.keys().then((names) => names.forEach((name) => caches.delete(name)))
```

จากนั้นรีโหลด F5 สักครั้ง

## 📝 Files ที่เปลี่ยน

1. `firebase.json` - เพิ่ม cache headers
2. `vite.config.js` - ปรับ PWA config
3. `public/service-worker.js` - dynamic cache version + improve fetch strategy
4. `src/main.js` - ใช้ new update handler
5. `src/utils/pwaUpdate.js` - NEW: PWA update handler
6. `src/composables/snackbar.js` - เพิ่ม actions support
7. `src/App.vue` - snackbar template support buttons
