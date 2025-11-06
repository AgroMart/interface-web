import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Importar estilos do Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Tema personalizado para agricultores - cores naturais e acessíveis
const theme = {
  defaultTheme: 'light',
  themes: {
    light: {
      dark: false,
      colors: {
        primary: '#4CAF50', // Verde natural
        secondary: '#8BC34A', // Verde claro
        accent: '#FF9800', // Laranja para destaque
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
        success: '#4CAF50',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'on-primary': '#FFFFFF',
        'on-secondary': '#000000',
        'on-background': '#000000',
        'on-surface': '#000000',
      }
    }
  }
}

export default createVuetify({
  components,
  directives,
  theme,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;', // Remove maiúsculas automáticas
      size: 'large', // Botões maiores para facilitar o toque
    },
    VCard: {
      elevation: 2,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable', // Campos mais espaçosos
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    }
  }
})

