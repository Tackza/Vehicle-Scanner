// src/db/index.js
import Dexie from 'dexie'

export const db = new Dexie('VehicleScanner')

// Version 6: เพิ่ม compound index project_id+timestamp สำหรับ query speed
db.version(6).stores({
   // ข้อมูลป้ายทะเบียนที่สแกน
   scannedPlates: '++id, uid, plateNumber, timestamp, synced, gps, stickerNumber, retryCount, lastSyncAttempt, syncedAt, local_id, project_id, [project_id+timestamp]',

   // ข้อมูลการลงทะเบียน
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',

   // Queue สำหรับ sync
   syncQueue: '++id, action, data, retryCount, createdAt, status',

   // User session
   userSession: 'id, token, userData',

   // Projects
   projects: 'project_id, name, start_time, end_time'
}).upgrade(async (trans) => {
   console.log('✓ Database upgraded to version 6 - added compound index [project_id+timestamp] for faster queries')
})

// Version 5: เพิ่ม project_id index ให้ scannedPlates
db.version(5).stores({
   // ข้อมูลป้ายทะเบียนที่สแกน
   scannedPlates: '++id, uid, plateNumber, timestamp, synced, gps, stickerNumber, retryCount, lastSyncAttempt, syncedAt, local_id, project_id',

   // ข้อมูลการลงทะเบียน
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',

   // Queue สำหรับ sync
   syncQueue: '++id, action, data, retryCount, createdAt, status',

   // User session
   userSession: 'id, token, userData',

   // Projects
   projects: 'project_id, name, start_time, end_time'
}).upgrade(async (trans) => {
   console.log('✓ Database upgraded to version 5 - added project_id index on scannedPlates')
})

// Version 4: เพิ่ม local_id field
db.version(4).stores({
   // ข้อมูลป้ายทะเบียนที่สแกน
   scannedPlates: '++id, uid, plateNumber, timestamp, synced, gps, stickerNumber, retryCount, lastSyncAttempt, syncedAt, local_id',

   // ข้อมูลการลงทะเบียน
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',

   // Queue สำหรับ sync
   syncQueue: '++id, action, data, retryCount, createdAt, status',

   // User session
   userSession: 'id, token, userData',

   // Projects
   projects: 'project_id, name, start_time, end_time'
}).upgrade(async (trans) => {
   console.log('✓ Database upgraded to version 4 - added local_id field and projects store')
})

// Version 3: เพิ่ม uid field
db.version(3).stores({
   // ข้อมูลป้ายทะเบียนที่สแกน
   scannedPlates: '++id, uid, plateNumber, timestamp, synced, gps, stickerNumber, retryCount, lastSyncAttempt, syncedAt',

   // ข้อมูลการลงทะเบียน
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',

   // Queue สำหรับ sync
   syncQueue: '++id, action, data, retryCount, createdAt, status',

   // User session
   userSession: 'id, token, userData'
}).upgrade(async (trans) => {
   // Migration: เพิ่ม uid สำหรับ records เก่าที่ยังไม่มี
   const plates = await trans.table('scannedPlates').toArray()
   await Promise.all(
      plates.map(plate => {
         if (!plate.uid) {
            const uid = `uid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
            return trans.table('scannedPlates').update(plate.id, { uid })
         }
      })
   )
   console.log('✓ Database upgraded to version 3')
})

// Version 2: เพิ่ม fields สำหรับ offline support
db.version(2).stores({
   scannedPlates: '++id, plateNumber, timestamp, synced, gps, stickerNumber, retryCount, lastSyncAttempt, syncedAt',
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',
   syncQueue: '++id, action, data, retryCount, createdAt, status',
   userSession: 'id, token, userData'
}).upgrade(async (trans) => {
   // Migration: เพิ่ม default values สำหรับ records เก่า
   const plates = await trans.table('scannedPlates').toArray()
   await Promise.all(
      plates.map(plate => {
         return trans.table('scannedPlates').update(plate.id, {
            retryCount: 0,
            lastSyncAttempt: null,
            syncedAt: null
         })
      })
   )
   console.log('✓ Database upgraded to version 2')
})

// Backward compatibility - version 1
db.version(1).stores({
   scannedPlates: '++id, plateNumber, timestamp, synced, gps, stickerNumber',
   registeredVehicles: 'plateNumber, stickerNumber, ownerName, expiryDate, updatedAt',
   syncQueue: '++id, action, data, retryCount, createdAt',
   userSession: 'id, token, userData'
})

// Helper function สำหรับ clear all data
export const clearAllData = async () => {
   await db.scannedPlates.clear()
   await db.registeredVehicles.clear()
   await db.syncQueue.clear()
   console.log('✓ Database cleared')
}

// Helper function สำหรับ export data
export const exportData = async () => {
   const scannedPlates = await db.scannedPlates.toArray()
   const scannedPlatesWithoutPhotos = scannedPlates.map(plate => {
      const { photo_file, ...rest } = plate
      return rest
   })

   const data = {
      scannedPlates: scannedPlatesWithoutPhotos,
      registeredVehicles: await db.registeredVehicles.toArray(),
      syncQueue: await db.syncQueue.toArray()
   }
   return data
}

// Get sync statistics
export const getSyncStats = async () => {
   const total = await db.scannedPlates.count()
   const synced = await db.scannedPlates.where('synced').equals(1).count()
   const pending = await db.scannedPlates.where('synced').equals(0).count()

   return {
      total,
      synced,
      pending,
      syncRate: total > 0 ? Math.round((synced / total) * 100) : 0
   }
}

// Get failed sync items (with retry count > 3)
export const getFailedSyncs = async () => {
   return await db.scannedPlates
      .where('synced')
      .equals(0)
      .and(item => (item.retryCount || 0) > 3)
      .toArray()
}

// Reset retry count for specific items
export const resetRetryCount = async (ids) => {
   await db.scannedPlates.bulkUpdate(
      ids.map((id) => ({
         key: id,
         changes: {
            retryCount: 0,
            lastSyncAttempt: null
         }
      }))
   )
}