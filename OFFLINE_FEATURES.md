# Offline Mode - สรุปการปรับปรุง

## ไฟล์ที่สร้างใหม่

### 1. `/public/service-worker.js`

Service Worker สำหรับจัดการ offline caching

- Cache static assets (HTML, CSS, JS)
- Network-first strategy สำหรับ navigation
- Cache-first strategy สำหรับ assets อื่นๆ
- รองรับการล้าง cache

### 2. `/public/manifest.json`

PWA Manifest สำหรับติดตั้งแอปบนมือถือ

- กำหนด icons, theme colors
- รองรับ shortcuts
- เปิดใช้งาน offline mode

### 3. `/OFFLINE_GUIDE.md`

คู่มือการใช้งานโหมด Offline

- อธิบายฟีเจอร์ที่ใช้งานได้/ไม่ได้ offline
- วิธีแก้ปัญหา
- Technical details

## ไฟล์ที่แก้ไข

### 1. `/src/main.js`

- เพิ่มการ register Service Worker
- Auto-check updates ทุก 1 นาที

### 2. `/src/services/sync.js`

**เพิ่มฟีเจอร์:**

- Auto-sync เมื่อ network กลับมา online
- Retry mechanism พร้อม retry count
- Batch processing (50 รายการต่อครั้ง)
- Network event listeners
- Sync interval ทุก 5 นาที
- Tracking: `isSyncing`, `retryCount`, `lastSyncAttempt`, `syncedAt`

**การทำงาน:**

```javascript
// Auto sync เมื่อ online
window.addEventListener('online', () => {
  this.syncToServer()
  this.syncRegistry()
})

// Sync แบบ batch
for (let i = 0; i < data.length; i += 50) {
  const batch = data.slice(i, i + 50)
  await api.post('/lpr/checkins', { plates: batch })
}
```

### 3. `/src/db/index.js`

**Database Schema v2:**

- เพิ่ม fields: `retryCount`, `lastSyncAttempt`, `syncedAt`
- Database migration จาก v1 → v2

**Helper Functions:**

- `getSyncStats()` - สถิติการ sync
- `getFailedSyncs()` - รายการที่ sync ล้มเหลว
- `resetRetryCount(ids)` - รีเซ็ต retry count

### 4. `/src/utils/offline.js`

**เพิ่มฟังก์ชัน:**

- `checkConnectivity()` - ตรวจสอบการเชื่อมต่อจริง (ไม่ใช่แค่ connected to network)
- `waitForOnline()` - รอจนกว่าจะ online
- `retryWithBackoff()` - Retry พร้อม exponential backoff
- Network status change events

### 5. `/src/components/NetworkStatus.vue`

**ปรับปรุง UI:**

- แสดงจำนวนรายการที่รอ sync
- Progress bar สำหรับ sync
- Event-driven sync status updates
- Auto-refresh pending count ทุก 5 วินาที

### 6. `/src/views/SyncStatusView.vue`

**ฟีเจอร์เพิ่มเติม:**

- แสดง online/offline status chip
- แสดงอัตราสำเร็จการ sync (%)
- แสดงรายการที่ sync ล้มเหลว (retry > 3)
- ปุ่ม "ลองซิงค์อีกครั้ง" สำหรับรายการที่ล้มเหลว
- Auto-refresh ทุก 10 วินาที
- Manual sync button

### 7. `/src/views/SettingsView.vue`

**เพิ่ม:**

- Card แสดงสถานะการเชื่อมต่อ
- แสดงจำนวนรายการที่รอ sync
- Sync button พร้อม loading state และ rotating icon
- Auto-refresh stats ทุก 10 วินาที
- Disable sync button เมื่อ offline

### 8. `/index.html`

**PWA Meta Tags:**

- Theme color
- Apple mobile web app meta tags
- Manifest link
- Icons
- เปลี่ยน lang เป็น "th"

## การทำงานของระบบ Offline

### 1. Data Flow (Offline Mode)

```
User Input → IndexedDB (synced=0)
         ↓
    [Auto-save complete]
         ↓
    [Wait for online]
```

### 2. Data Flow (Online Mode)

```
User Input → IndexedDB (synced=0)
         ↓
    [Every 5 min OR manual trigger]
         ↓
    Sync Service (batch 50)
         ↓
    API Server
         ↓
    Update synced=1, syncedAt
```

### 3. Network State Changes

```
Offline → Online:
  1. Show "กลับมาออนไลน์แล้ว" snackbar
  2. Wait 1 second
  3. Auto sync started
  4. Batch upload (50 items/batch)
  5. Update sync status
  6. Show "ซิงค์สำเร็จ X รายการ"

Online → Offline:
  1. Show "ไม่มีอินเทอร์เน็ต" snackbar
  2. Disable sync buttons
  3. Continue saving to IndexedDB
```

### 4. Retry Strategy

```
Sync Failed:
  retryCount++
  lastSyncAttempt = now()

If retryCount > 3:
  Show in "Failed Syncs" section
  Allow manual retry

Manual Retry:
  resetRetryCount()
  Try sync again
```

## ฟีเจอร์หลัก

✅ **PWA Support** - ติดตั้งแอปบนหน้าจอหลัก
✅ **Service Worker** - Cache assets สำหรับ offline
✅ **IndexedDB** - เก็บข้อมูลในเครื่อง
✅ **Auto Sync** - ซิงค์อัตโนมัติเมื่อ online
✅ **Retry Mechanism** - ลองซิงค์อีกครั้งถ้าล้มเหลว
✅ **Batch Processing** - ส่งข้อมูลเป็น batch
✅ **Network Detection** - ตรวจจับสถานะ network
✅ **Sync Status UI** - แสดงสถานะ sync แบบ real-time
✅ **Failed Sync Recovery** - กู้คืนรายการที่ sync ล้มเหลว

## ข้อแนะนำเพิ่มเติม

### สร้างไอคอน PWA

ต้องสร้างไอคอน 2 ขนาด:

- `/public/icon-192x192.png` (192x192 pixels)
- `/public/icon-512x512.png` (512x512 pixels)

**วิธีสร้าง:**

1. ใช้ Canva หรือ Figma สร้างโลโก้
2. Export เป็น PNG ขนาด 512x512
3. ใช้ online tool (เช่น realfavicongenerator.net) สร้างขนาดต่างๆ

### การทดสอบ Offline Mode

**Chrome DevTools:**

```
1. เปิด DevTools (F12)
2. Application tab → Service Workers → ✓ Offline
3. ทดสอบการบันทึกข้อมูล
4. เช็ค Application → IndexedDB → VehicleScanner
5. เปลี่ยนกลับเป็น Online
6. ดู Network tab เพื่อดูการ sync
```

**Mobile Testing:**

```
1. Build production: npm run build
2. Deploy หรือ serve locally
3. เปิดใน Chrome mobile
4. เปิดโหมดเครื่องบิน
5. ทดสอบการบันทึกข้อมูล
6. ปิดโหมดเครื่องบิน
7. ดูการ auto sync
```

### Performance Monitoring

```javascript
// ดูข้อมูล IndexedDB
await db.scannedPlates.count()
await getSyncStats()

// ดู Service Worker status
navigator.serviceWorker.getRegistrations()

// ดู Network status
navigator.onLine
```

## สรุป

ระบบ offline ทำงานได้อย่างสมบูรณ์:

- บันทึกข้อมูลได้แม้ไม่มีเน็ต
- Auto sync เมื่อกลับมา online
- UI แสดงสถานะชัดเจน
- Retry mechanism แข็งแรง
- PWA ready สำหรับติดตั้งบนมือถือ
