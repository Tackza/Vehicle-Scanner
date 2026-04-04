/**
 * Calculate similarity score between two strings using Levenshtein distance
 * Returns a score between 0 and 1, where 1 is identical
 */
function calculateSimilarity(str1, str2) {
   const s1 = str1.toLowerCase().trim()
   const s2 = str2.toLowerCase().trim()

   if (s1 === s2) return 1
   if (s1.length === 0 || s2.length === 0) return 0

   // Levenshtein distance implementation
   const matrix = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(0))

   for (let i = 0; i <= s1.length; i++) {
      matrix[0][i] = i
   }
   for (let j = 0; j <= s2.length; j++) {
      matrix[j][0] = j
   }

   for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
         const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
         matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, // deletion
            matrix[j - 1][i] + 1, // insertion
            matrix[j - 1][i - 1] + indicator // substitution
         )
      }
   }

   const maxLen = Math.max(s1.length, s2.length)
   const distance = matrix[s2.length][s1.length]
   return 1 - distance / maxLen
}

/**
 * Find the closest matching province from the list
 * @param {string} input - The input province name (possibly from OCR)
 * @param {array} provinces - Array of valid province names
 * @param {number} threshold - Minimum similarity score (0-1)
 * @returns {string|null} - The best matching province or null if no match found
 */
export function findClosestProvince(input, provinces, threshold = 0.6) {
   if (!input || !provinces || provinces.length === 0) {
      return input
   }

   let bestMatch = null
   let bestScore = threshold

   provinces.forEach((province) => {
      const score = calculateSimilarity(input, province)
      if (score > bestScore) {
         bestScore = score
         bestMatch = province
      }
   })

   return bestMatch || input
}
