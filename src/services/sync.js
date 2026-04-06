// src/services/sync.js
import { db } from '@/db'
import { isOnline } from '@/utils/offline'
import { api } from './api'

class SyncService {
   constructor() {
      this.syncInterval = null
      this.registryInterval = null
      this.isRunning = false
      this.isSyncing = false

      // Listen for online/offline events
      this.setupNetworkListeners()
   }

   setupNetworkListeners() {
      window.addEventListener('online', () => {
         console.log('🌐 Network is online - starting sync')
         this.syncToServer()
         // this.syncRegistry()
      })

      window.addEventListener('offline', () => {
         console.log('📡 Network is offline')
      })
   }

   start() {
      if (this.isRunning) return

      this.isRunning = true
      console.log('🔄 Sync service started')

      // Sync ทุก 60 วินาที
      this.syncInterval = setInterval(() => {
         const onlineStatus = isOnline()
         console.log(`⏰ Sync interval tick - Online: ${onlineStatus}, Syncing: ${this.isSyncing}`)
         if (onlineStatus) {
            this.syncToServer()
         } else {
            console.log('⚠️ Skip sync - offline')
         }
      }, 60 * 1000)

      this.registryInterval = setInterval(() => {
         if (isOnline()) {
            // this.syncRegistry()
         }
      }, 60 * 1000)

      // Run ทันทีถ้าออนไลน์
      if (isOnline()) {
         setTimeout(() => {
            this.syncToServer()
            // this.syncRegistry()
         }, 2000)
      }
   }

   stop() {
      clearInterval(this.syncInterval)
      clearInterval(this.registryInterval)
      this.isRunning = false
      console.log('⏸️ Sync service stopped')
   }

   async syncToServer() {
      console.log('🔔 syncToServer called')
      // Check if loginData exists in localStorage
      if (!localStorage.getItem('loginData')) {
         console.log('🚫 No loginData in localStorage - skipping sync')
         return { success: false, reason: 'no_login_data' }
      }
      if (!isOnline()) {
         console.log('📡 Offline - skipping sync')
         return { success: false, reason: 'offline' }
      }

      if (this.isSyncing) {
         console.log('⏳ Sync already in progress')
         return { success: false, reason: 'already_syncing' }
      }

      this.isSyncing = true

      try {
         const unsyncedData = await db.scannedPlates
            .where('synced')
            .equals(0)
            .toArray()
         console.log(`📋 Found ${unsyncedData.length} unsynced records`)

         if (unsyncedData.length === 0) {
            console.log('✓ No data to sync')
            return { success: true, count: 0 }
         }

         console.log(`📤 Syncing ${unsyncedData.length} records...`)

         // Process in batches of 50 records
         const batchSize = 50
         let syncedCount = 0
         let failedCount = 0
         console.log('unsyncedData :>> ', unsyncedData);

         for (let i = 0; i < unsyncedData.length; i += batchSize) {
            const batch = unsyncedData.slice(i, i + batchSize)
            console.log('batch :>> ', batch);

            // Prepare FormData for batch (no _{idx} in keys)
            const formData = new FormData()
            batch.forEach((item) => {
               Object.entries(item).forEach(([key, value]) => {
                  if (key === 'photo_file' && value) {
                     // Convert base64 to Blob if needed
                     let fileBlob = value
                     if (typeof value === 'string' && value.startsWith('data:')) {
                        const arr = value.split(',')
                        const mime = arr[0].match(/:(.*?);/)[1]
                        const bstr = atob(arr[1])
                        let n = bstr.length
                        const u8arr = new Uint8Array(n)
                        while (n--) {
                           u8arr[n] = bstr.charCodeAt(n)
                        }
                        fileBlob = new Blob([u8arr], { type: mime })
                     }
                     formData.append('photo_file', fileBlob, `photo_${item.uid || ''}.jpg`)
                  } else if (key !== 'id') {
                     // Exclude id (local only)
                     if (key === 'ocr_connected') {
                        formData.append(key, value == true ? 1 : 0)
                     } else {
                        formData.append(key, value == null ? '' : value)
                     }
                  }
               })
            })
            // แสดง key-value ทั้งหมดใน formData
            // for (let pair of formData.entries()) {
            //    console.log('FormData', pair[0] + ':', pair[1]);
            // }
            formData.append('batch_count', batch.length)

            try {
               const response = await api.post('/park/checkins', formData, {
                  headers: {
                     'Content-Type': 'multipart/form-data'
                  }
               })

               if (response.status !== 200 || response.data.status !== 'success') {
                  throw new Error(`Server error: ${response.data.message || response.statusText}`)
               }

               // Update synced flag for this batch
               const ids = batch.map((d) => d.id)
               await db.scannedPlates.bulkUpdate(
                  ids.map((id) => ({ key: id, changes: { synced: 1, syncedAt: new Date() } }))
               )

               syncedCount += batch.length
               console.log(`✓ Synced batch: ${batch.length} records (Total: ${syncedCount}/${unsyncedData.length})`)
            } catch (batchError) {
               console.error(`✗ Batch sync failed at index ${i}:`, batchError.message)
               failedCount += batch.length

               // Update retry count for failed items
               const ids = batch.map((d) => d.id)
               await db.scannedPlates.bulkUpdate(
                  ids.map((id) => ({
                     key: id,
                     changes: {
                        retryCount: (batch.find(b => b.id === id)?.retryCount || 0) + 1,
                        lastSyncAttempt: new Date()
                     }
                  }))
               )
            }
         }

         console.log(`✓ Sync completed: ${syncedCount} success, ${failedCount} failed`)
         return {
            success: true,
            synced: syncedCount,
            failed: failedCount,
            total: unsyncedData.length
         }
      } catch (error) {
         console.error('❌ Sync to server failed:', error.message)
         return { success: false, error: error.message }
      } finally {
         this.isSyncing = false
      }
   }


}

export const syncService = new SyncService()