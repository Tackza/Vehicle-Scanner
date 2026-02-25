// src/utils/uid.js

/**
 * Generate a unique ID for each scanned plate
 * Format: uid_timestamp_randomstring
 * Example: uid_1707825600000_a3k9x2m1p
 */
export const generateUID = () => {
   const timestamp = Date.now()
   const random = Math.random().toString(36).substring(2, 11)
   return `${timestamp}_${random}`
}

/**
 * Generate UUID v4 (if browser supports crypto.randomUUID)
 * Falls back to custom UID if not supported
 */
export const generateUUID = () => {
   if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
   }
   return generateUID()
}
