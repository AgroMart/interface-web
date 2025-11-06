import { defineStore } from 'pinia'
import { onLoadingChange } from '../services/api'

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    isOnline: navigator.onLine,
    snackbar: {
      show: false,
      message: '',
      color: 'info',
      timeout: 4000
    },
    drawer: false, // Para menu lateral em telas maiores
  }),

  actions: {
    // Inicializar listeners
    init() {
      // Listener para mudanças no loading da API
      onLoadingChange((isLoading) => {
        this.isLoading = isLoading
      })

      // Listeners para status de conexão
      window.addEventListener('online', () => {
        this.isOnline = true
        this.showSnackbar('Conexão restabelecida', 'success')
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.showSnackbar('Sem conexão com a internet', 'warning')
      })
    },

    // Mostrar mensagem
    showSnackbar(message, color = 'info', timeout = 4000) {
      this.snackbar = {
        show: true,
        message,
        color,
        timeout
      }
    },

    // Fechar mensagem
    hideSnackbar() {
      this.snackbar.show = false
    },

    // Toggle do drawer
    toggleDrawer() {
      this.drawer = !this.drawer
    },

    // Fechar drawer
    closeDrawer() {
      this.drawer = false
    }
  }
})

