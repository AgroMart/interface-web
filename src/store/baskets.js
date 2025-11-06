import { defineStore } from 'pinia'
import { apiService } from '../services/api'
import { useAppStore } from './app'

export const useBasketStore = defineStore('baskets', {
  state: () => ({
    baskets: [],
    currentBasket: null,
    loading: false,
    error: null,
    // Cache para uso offline
    cachedBaskets: JSON.parse(localStorage.getItem('agromart_baskets') || '[]'),
    lastFetch: localStorage.getItem('agromart_baskets_last_fetch')
  }),

  getters: {
    // Cestas ordenadas por valor
    sortedBaskets: (state) => {
      return [...state.baskets].sort((a, b) => 
        a.attributes.valor - b.attributes.valor
      )
    },

    // Cestas disponíveis (com quantidade > 0)
    availableBaskets: (state) => {
      return state.baskets.filter(basket => 
        basket.attributes.quantidade > 0
      )
    },

    // Cestas por loja
    basketsByStore: (state) => {
      return (storeId) => state.baskets.filter(basket => 
        basket.attributes.loja?.data?.id === storeId
      )
    }
  },

  actions: {
    // Buscar todas as cestas
    async fetchBaskets(useCache = false) {
      const appStore = useAppStore()
      
      // Se offline ou solicitado cache, usar dados em cache
      if (!appStore.isOnline || useCache) {
        if (this.cachedBaskets.length > 0) {
          this.baskets = this.cachedBaskets
          return
        }
      }

      this.loading = true
      this.error = null

      try {
        const response = await apiService.getBaskets()
        this.baskets = response.data
        
        // Salvar no cache
        this.saveToCache()
        
        appStore.showSnackbar('Cestas carregadas com sucesso', 'success')
      } catch (error) {
        this.error = error.message
        
        // Se falhou e tem cache, usar cache
        if (this.cachedBaskets.length > 0) {
          this.baskets = this.cachedBaskets
          appStore.showSnackbar('Usando dados salvos (sem internet)', 'warning')
        } else {
          appStore.showSnackbar('Erro ao carregar cestas', 'error')
        }
      } finally {
        this.loading = false
      }
    },

    // Buscar cesta específica
    async fetchBasket(id) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await apiService.getBasket(id)
        this.currentBasket = response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao carregar cesta', 'error')
      } finally {
        this.loading = false
      }
    },

    // Criar nova cesta
    async createBasket(basketData) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await apiService.createBasket(basketData)
        this.baskets.push(response.data)
        this.saveToCache()
        appStore.showSnackbar('Cesta criada com sucesso', 'success')
        return response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao criar cesta', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Atualizar cesta
    async updateBasket(id, basketData) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await apiService.updateBasket(id, basketData)
        const index = this.baskets.findIndex(b => b.id === id)
        if (index !== -1) {
          this.baskets[index] = response.data
        }
        this.saveToCache()
        appStore.showSnackbar('Cesta atualizada com sucesso', 'success')
        return response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao atualizar cesta', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Deletar cesta
    async deleteBasket(id) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        await apiService.deleteBasket(id)
        this.baskets = this.baskets.filter(b => b.id !== id)
        this.saveToCache()
        appStore.showSnackbar('Cesta removida com sucesso', 'success')
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao remover cesta', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Salvar no cache local
    saveToCache() {
      localStorage.setItem('agromart_baskets', JSON.stringify(this.baskets))
      localStorage.setItem('agromart_baskets_last_fetch', new Date().toISOString())
      this.cachedBaskets = this.baskets
      this.lastFetch = new Date().toISOString()
    },

    // Limpar cache
    clearCache() {
      localStorage.removeItem('agromart_baskets')
      localStorage.removeItem('agromart_baskets_last_fetch')
      this.cachedBaskets = []
      this.lastFetch = null
    }
  }
})

