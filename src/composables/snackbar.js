// src/composables/snackbar.js
import { ref } from 'vue'

const snackbar = ref({
   show: false,
   message: '',
   color: 'success',
   timeout: 5000,
   position: 'bottom',
   actions: []
})

export const useSnackbar = () => {
   const show = (message, color = 'success', timeout = 5000, actions = []) => {
      snackbar.value = {
         show: true,
         message,
         color,
         timeout,
         actions
      }
   }

   return {
      snackbar,
      show
   }
}