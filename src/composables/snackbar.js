// src/composables/snackbar.js
import { ref } from 'vue'

const snackbar = ref({
   show: false,
   message: '',
   color: 'success',
   timeout: 3000,
   position: 'bottom'
})

export const useSnackbar = () => {
   const showSnackbar = (message, color = 'success', timeout = 3000) => {
      snackbar.value = {
         show: true,
         message,
         color,
         timeout
      }
   }

   return {
      snackbar,
      showSnackbar
   }
}