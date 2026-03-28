// src/plugins/vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
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
         color: '#1C1917',
      },
      VAutocomplete: {
         variant: 'outlined',
         density: 'comfortable',
         color: '#1C1917',
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
               primary: '#1C1917',
               'primary-darken-1': '#0C0A09',
               secondary: '#78716C',
               'secondary-darken-1': '#57534E',
               accent: '#1C1917',
               error: '#DC2626',
               info: '#2563EB',
               success: '#16A34A',
               warning: '#D97706',
               'on-background': '#1C1917',
               'on-surface': '#1C1917',
               'on-primary': '#FFFFFF',
            }
         }
      }
   }
})
