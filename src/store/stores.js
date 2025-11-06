import { defineStore } from 'pinia'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const useStoreStore = defineStore('stores', {
  state: () => ({
    stores: [],
    currentStore: null,
    loading: false,
    error: null,
    // Cache para uso offline
    cachedStores: JSON.parse(localStorage.getItem('agromart_stores') || '[]'),
    lastFetch: localStorage.getItem('agromart_stores_last_fetch')
  }),

  getters: {
    // Lojas ordenadas por nome
    sortedStores: (state) => {
      return [...state.stores].sort((a, b) => 
        a.attributes.nome.localeCompare(b.attributes.nome)
      )
    },

    // Loja principal (primeira loja do usuário)
    mainStore: (state) => {
      return state.stores.length > 0 ? state.stores[0] : null
    }
  },

  actions: {
    // Buscar todas as lojas
    async fetchStores(useCache = false) {
      const appStore = useAppStore()
      
      // Se offline ou solicitado cache, usar dados em cache
      if (!appStore.isOnline || useCache) {
        if (this.cachedStores.length > 0) {
          this.stores = this.cachedStores
          return
        }
      }

      this.loading = true
      this.error = null

      try {
        const response = await apiService.getStores()
        this.stores = response.data
        
        // Salvar no cache
        this.saveToCache()
        
        appStore.showSnackbar('Lojas carregadas com sucesso', 'success')
      } catch (error) {
        this.error = error.message
        
        // Se falhou e tem cache, usar cache
        if (this.cachedStores.length > 0) {
          this.stores = this.cachedStores
          appStore.showSnackbar('Usando dados salvos (sem internet)', 'warning')
        } else {
          appStore.showSnackbar('Erro ao carregar lojas', 'error')
        }
      } finally {
        this.loading = false
      }
    },

    // Buscar loja específica
    async fetchStore(id) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await apiService.getStore(id)
        this.currentStore = response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao carregar loja', 'error')
      } finally {
        this.loading = false
      }
    },

    // Atualizar loja
    async updateStore(id, storeData) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await apiService.updateStore(id, storeData)
        const index = this.stores.findIndex(s => s.id === id)
        if (index !== -1) {
          this.stores[index] = response.data
        }
        if (this.currentStore && this.currentStore.id === id) {
          this.currentStore = response.data
        }
        this.saveToCache()
        appStore.showSnackbar('Loja atualizada com sucesso', 'success')
        return response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao atualizar loja', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Salvar no cache local
    saveToCache() {
      localStorage.setItem('agromart_stores', JSON.stringify(this.stores))
      localStorage.setItem('agromart_stores_last_fetch', new Date().toISOString())
      this.cachedStores = this.stores
      this.lastFetch = new Date().toISOString()
    },

    // Limpar cache
    clearCache() {
      localStorage.removeItem('agromart_stores')
      localStorage.removeItem('agromart_stores_last_fetch')
      this.cachedStores = []
      this.lastFetch = null
    }
  }
})

