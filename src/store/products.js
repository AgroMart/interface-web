import { defineStore } from 'pinia'
// import { apiService } from '../services/api'
import { productsService } from '../services/productsServices'
import { useAppStore } from './app'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    currentProduct: null,
    loading: false,
    error: null,
    // Cache para uso offline
    cachedProducts: JSON.parse(localStorage.getItem('agromart_products') || '[]'),
    lastFetch: localStorage.getItem('agromart_products_last_fetch')
  }),

  getters: {
    // Produtos ordenados por nome
    sortedProducts: (state) => {
      return [...state.products].sort((a, b) => 
        a.attributes.nome.localeCompare(b.attributes.nome)
      )
    },

    // Produtos disponíveis (com quantidade > 0)
    availableProducts: (state) => {
      return state.products.filter(product => 
        product.attributes.quantidade > 0
      )
    },

    // Produtos por loja
    productsByStore: (state) => {
      return (storeId) => state.products.filter(product => 
        product.attributes.loja?.data?.id === storeId
      )
    }
  },

  actions: {
    // Buscar todos os produtos
    async fetchProducts(useCache = false) {
      const appStore = useAppStore()
      
      // Se offline ou solicitado cache, usar dados em cache
      if (!appStore.isOnline || useCache) {
        if (this.cachedProducts.length > 0) {
          this.products = this.cachedProducts
          return
        }
      }

      this.loading = true
      this.error = null

      try {
        const response = await productsService.getProducts()
        this.products = response.data

        // Salvar no cache
        this.saveToCache()
        
        appStore.showSnackbar('Produtos carregados com sucesso', 'success')
      } catch (error) {
        this.error = error.message
        
        // Se falhou e tem cache, usar cache
        if (this.cachedProducts.length > 0) {
          this.products = this.cachedProducts
          appStore.showSnackbar('Usando dados salvos (sem internet)', 'warning')
        } else {
          appStore.showSnackbar('Erro ao carregar produtos', 'error')
        }
      } finally {
        this.loading = false
      }
    },

    // Buscar produto específico
    async fetchProduct(id) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await productsService.getProduct(id)
        this.currentProduct = response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao carregar produto', 'error')
      } finally {
        this.loading = false
      }
    },

    // Criar novo produto
    async createProduct(productData) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await productsService.createProduct(productData)
        this.products.push(response.data)
        this.saveToCache()
        appStore.showSnackbar('Produto criado com sucesso', 'success')
        return response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao criar produto', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Atualizar produto
    async updateProduct(id, productData) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        const response = await productsService.updateProduct(id, productData)
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products[index] = response.data
        }
        this.saveToCache()
        appStore.showSnackbar('Produto atualizado com sucesso', 'success')
        return response.data
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao atualizar produto', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Deletar produto
    async deleteProduct(id) {
      const appStore = useAppStore()
      this.loading = true
      this.error = null

      try {
        await productsService.deleteProduct(id)
        this.products = this.products.filter(p => p.id !== id)
        this.saveToCache()
        appStore.showSnackbar('Produto removido com sucesso', 'success')
      } catch (error) {
        this.error = error.message
        appStore.showSnackbar('Erro ao remover produto', 'error')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Salvar no cache local
    saveToCache() {
      localStorage.setItem('agromart_products', JSON.stringify(this.products))
      localStorage.setItem('agromart_products_last_fetch', new Date().toISOString())
      this.cachedProducts = this.products
      this.lastFetch = new Date().toISOString()
    },

    // Limpar cache
    clearCache() {
      localStorage.removeItem('agromart_products')
      localStorage.removeItem('agromart_products_last_fetch')
      this.cachedProducts = []
      this.lastFetch = null
    }
  }
})

