import { defineStore } from 'pinia'
import { authService } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    userRole: (state) => state.user?.role?.type || null,
    userName: (state) => state.user?.username || '',
    userEmail: (state) => state.user?.email || ''
  },

  actions: {
    // Inicializar autenticação do localStorage
    async initAuth() {
      const token = localStorage.getItem('agromart_token')
      const user = localStorage.getItem('agromart_user')
      
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
        
        // Validar token com o servidor
        try {
          await this.validateToken()
        } catch (error) {
          console.error('Token inválido:', error)
          this.logout()
        }
      }
    },

    // Login
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.login(credentials)
        const { jwt, user } = response.data
        
        // Salvar no state
        this.token = jwt
        this.user = user
        this.isAuthenticated = true
        
        // Persistir no localStorage
        localStorage.setItem('agromart_token', jwt)
        localStorage.setItem('agromart_user', JSON.stringify(user))
        
        this.loading = false
        return { success: true, user }
      } catch (error) {
        this.loading = false
        this.error = error.response?.data?.error?.message || 'Erro ao fazer login'
        console.error('Erro no login:', error)
        return { success: false, error: this.error }
      }
    },

    // Registro
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.register(userData)
        const { jwt, user } = response.data
        
        // Salvar no state
        this.token = jwt
        this.user = user
        this.isAuthenticated = true
        
        // Persistir no localStorage
        localStorage.setItem('agromart_token', jwt)
        localStorage.setItem('agromart_user', JSON.stringify(user))
        
        this.loading = false
        return { success: true, user }
      } catch (error) {
        this.loading = false
        this.error = error.response?.data?.error?.message || 'Erro ao criar conta'
        console.error('Erro no registro:', error)
        return { success: false, error: this.error }
      }
    },

    // Logout
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.error = null
      
      // Limpar localStorage
      localStorage.removeItem('agromart_token')
      localStorage.removeItem('agromart_user')
    },

    // Validar token
    async validateToken() {
      try {
        const response = await authService.getMe()
        this.user = response.data
        return true
      } catch (error) {
        console.error('Token inválido:', error)
        return false
      }
    },

    // Atualizar perfil
    async updateProfile(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.updateMe(userData)
        this.user = response.data
        
        // Atualizar localStorage
        localStorage.setItem('agromart_user', JSON.stringify(this.user))
        
        this.loading = false
        return { success: true, user: this.user }
      } catch (error) {
        this.loading = false
        this.error = error.response?.data?.error?.message || 'Erro ao atualizar perfil'
        console.error('Erro ao atualizar perfil:', error)
        return { success: false, error: this.error }
      }
    },

    // Recuperar senha
    async forgotPassword(email) {
      this.loading = true
      this.error = null
      
      try {
        await authService.forgotPassword(email)
        this.loading = false
        return { success: true }
      } catch (error) {
        this.loading = false
        this.error = error.response?.data?.error?.message || 'Erro ao enviar email'
        console.error('Erro ao recuperar senha:', error)
        return { success: false, error: this.error }
      }
    },

    // Resetar senha
    async resetPassword(code, password, passwordConfirmation) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.resetPassword({
          code,
          password,
          passwordConfirmation
        })
        
        const { jwt, user } = response.data
        
        // Salvar no state
        this.token = jwt
        this.user = user
        this.isAuthenticated = true
        
        // Persistir no localStorage
        localStorage.setItem('agromart_token', jwt)
        localStorage.setItem('agromart_user', JSON.stringify(user))
        
        this.loading = false
        return { success: true }
      } catch (error) {
        this.loading = false
        this.error = error.response?.data?.error?.message || 'Erro ao resetar senha'
        console.error('Erro ao resetar senha:', error)
        return { success: false, error: this.error }
      }
    },

    // Limpar erro
    clearError() {
      this.error = null
    }
  }
})
