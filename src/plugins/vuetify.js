// src/plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

export default createVuetify({
   components,
   directives,
   defaults: {
      VCard: {
         elevation: 0,
      },
      VBtn: {
         elevation: 0,
      },
      VTextField: {
         variant: 'outlined',
         density: 'comfortable',
         color: '#1e88e5',
      },
      VAutocomplete: {
         variant: 'outlined',
         density: 'comfortable',
         color: '#1e88e5',
      },
   },
   theme: {
      defaultTheme: 'minimal',
      themes: {
         minimal: {
            dark: false,
            colors: {
               background: '#FAFAF9',
               surface: '#FFFFFF',
               'surface-variant': '#F5F5F4',
               primary: '#1e88e5',
               'primary-darken-1': '#1565c0',
               secondary: '#78716C',
               'secondary-darken-1': '#57534E',
               accent: '#fc4b6c',
               error: '#DC2626',
               info: '#1e88e5',
               success: '#8cc152',
               warning: '#D97706',
               'on-background': '#563dea',
               'on-surface': '#563dea',
               'on-primary': '#FFFFFF',
               base: '#ff28b3',
               buscolor: '#ff28b3',
               default: '#563dea',
            }
         }
      }
   }
})
