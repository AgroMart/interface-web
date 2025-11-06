// Utilitários para funcionalidades offline
// Gerencia cache, sincronização e armazenamento local

// Registrar Service Worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration)
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                showUpdateNotification()
              }
            })
          })
        })
        .catch(error => {
          console.log('Erro ao registrar Service Worker:', error)
        })
    })
  }
}

// Mostrar notificação de atualização
const showUpdateNotification = () => {
  if (confirm('Nova versão disponível! Deseja atualizar?')) {
    window.location.reload()
  }
}

// Verificar status de conexão
export const isOnline = () => {
  return navigator.onLine
}

// Listeners para mudanças de conexão
export const setupConnectionListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  
  // Cleanup function
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Cache de dados no localStorage
export const cacheManager = {
  // Salvar dados
  set(key, data, expiration = 24 * 60 * 60 * 1000) { // 24 horas por padrão
    const item = {
      data,
      timestamp: Date.now(),
      expiration
    }
    localStorage.setItem(`agromart_${key}`, JSON.stringify(item))
  },

  // Buscar dados
  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`agromart_${key}`))
      if (!item) return null

      // Verificar expiração
      if (Date.now() - item.timestamp > item.expiration) {
        this.remove(key)
        return null
      }

      return item.data
    } catch (error) {
      console.error('Erro ao buscar cache:', error)
      return null
    }
  },

  // Remover dados
  remove(key) {
    localStorage.removeItem(`agromart_${key}`)
  },

  // Limpar cache expirado
  cleanup() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('agromart_'))
    keys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item && Date.now() - item.timestamp > item.expiration) {
          localStorage.removeItem(key)
        }
      } catch (error) {
        // Remove itens corrompidos
        localStorage.removeItem(key)
      }
    })
  },

  // Obter tamanho do cache
  getSize() {
    let size = 0
    const keys = Object.keys(localStorage).filter(key => key.startsWith('agromart_'))
    keys.forEach(key => {
      size += localStorage.getItem(key).length
    })
    return size
  }
}

// Gerenciador de sincronização
export const syncManager = {
  // Adicionar item para sincronização
  addPendingSync(type, data) {
    const pending = this.getPendingSync()
    const item = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    }
    pending.push(item)
    localStorage.setItem('agromart_pending_sync', JSON.stringify(pending))
    
    // Tentar sincronizar imediatamente se online
    if (isOnline()) {
      this.processPendingSync()
    }
  },

  // Buscar itens pendentes
  getPendingSync() {
    try {
      return JSON.parse(localStorage.getItem('agromart_pending_sync') || '[]')
    } catch (error) {
      return []
    }
  },

  // Processar sincronização pendente
  async processPendingSync() {
    const pending = this.getPendingSync()
    const processed = []

    for (const item of pending) {
      try {
        await this.syncItem(item)
        processed.push(item.id)
      } catch (error) {
        console.error('Erro ao sincronizar item:', error)
        
        // Incrementar tentativas
        item.retries = (item.retries || 0) + 1
        
        // Remover após muitas tentativas
        if (item.retries >= 3) {
          processed.push(item.id)
        }
      }
    }

    // Remover itens processados
    const remaining = pending.filter(item => !processed.includes(item.id))
    localStorage.setItem('agromart_pending_sync', JSON.stringify(remaining))
  },

  // Sincronizar item específico
  async syncItem(item) {
    // Implementar lógica específica por tipo
    switch (item.type) {
      case 'product':
        return await this.syncProduct(item.data)
      case 'basket':
        return await this.syncBasket(item.data)
      case 'store':
        return await this.syncStore(item.data)
      default:
        throw new Error(`Tipo de sincronização não suportado: ${item.type}`)
    }
  },

  // Sincronizar produto
  async syncProduct(data) {
    // Implementar chamada para API
    console.log('Sincronizando produto:', data)
  },

  // Sincronizar cesta
  async syncBasket(data) {
    // Implementar chamada para API
    console.log('Sincronizando cesta:', data)
  },

  // Sincronizar loja
  async syncStore(data) {
    // Implementar chamada para API
    console.log('Sincronizando loja:', data)
  }
}

// Compressão de dados para economizar espaço
export const compression = {
  // Comprimir dados (implementação simples)
  compress(data) {
    try {
      return btoa(JSON.stringify(data))
    } catch (error) {
      return data
    }
  },

  // Descomprimir dados
  decompress(compressedData) {
    try {
      return JSON.parse(atob(compressedData))
    } catch (error) {
      return compressedData
    }
  }
}

// Estimativa de uso de dados
export const dataUsage = {
  // Calcular tamanho de dados
  calculateSize(data) {
    return new Blob([JSON.stringify(data)]).size
  },

  // Verificar se deve usar cache baseado na conexão
  shouldUseCache() {
    // Verificar tipo de conexão se disponível
    if ('connection' in navigator) {
      const connection = navigator.connection
      const slowConnections = ['slow-2g', '2g', '3g']
      return slowConnections.includes(connection.effectiveType)
    }
    return false
  },

  // Otimizar dados para conexões lentas
  optimizeForSlowConnection(data) {
    // Remover campos desnecessários
    const optimized = { ...data }
    
    // Remover imagens grandes se conexão lenta
    if (this.shouldUseCache() && optimized.imagem) {
      delete optimized.imagem
    }
    
    return optimized
  }
}

// Inicialização das funcionalidades offline
export const initOfflineFeatures = () => {
  // Registrar Service Worker
  registerServiceWorker()
  
  // Limpar cache expirado
  cacheManager.cleanup()
  
  // Configurar sincronização automática quando voltar online
  setupConnectionListeners(
    () => {
      console.log('Conexão restabelecida - iniciando sincronização')
      syncManager.processPendingSync()
    },
    () => {
      console.log('Conexão perdida - modo offline ativado')
    }
  )
  
  // Sincronizar dados pendentes se online
  if (isOnline()) {
    syncManager.processPendingSync()
  }
}

