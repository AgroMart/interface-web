// Utilitários para otimização de performance
// Lazy loading, debounce, throttle e outras otimizações

// Debounce - evita execução excessiva de funções
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Throttle - limita execução de funções
export const throttle = (func, limit) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy loading de imagens
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      })
    })

    const lazyImages = document.querySelectorAll('img[data-src]')
    lazyImages.forEach(img => imageObserver.observe(img))
  }
}

// Preload de recursos críticos
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/static/css/main.css',
    '/static/js/bundle.js'
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    link.as = resource.endsWith('.css') ? 'style' : 'script'
    document.head.appendChild(link)
  })
}

// Otimização de imagens
export const imageOptimizer = {
  // Redimensionar imagem
  resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  },

  // Comprimir imagem
  compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  },

  // Gerar thumbnail
  generateThumbnail(file, size = 150) {
    return this.resizeImage(file, size, size, 0.6)
  }
}

// Monitoramento de performance
export const performanceMonitor = {
  // Medir tempo de carregamento
  measureLoadTime() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      }
    }
    return null
  },

  // Medir uso de memória
  measureMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  },

  // Medir FPS
  measureFPS() {
    let fps = 0
    let lastTime = performance.now()
    let frames = 0

    const measure = (currentTime) => {
      frames++
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
      }
      requestAnimationFrame(measure)
    }

    requestAnimationFrame(measure)
    return () => fps
  },

  // Log de métricas
  logMetrics() {
    const loadTime = this.measureLoadTime()
    const memory = this.measureMemoryUsage()
    
    console.group('Performance Metrics')
    if (loadTime) {
      console.log('Load Time:', loadTime)
    }
    if (memory) {
      console.log('Memory Usage:', memory)
    }
    console.groupEnd()
  }
}

// Otimização de bundle
export const bundleOptimizer = {
  // Lazy loading de componentes Vue
  lazyComponent(importFunc) {
    return () => ({
      component: importFunc(),
      loading: {
        template: '<div class="text-center pa-4"><v-progress-circular indeterminate></v-progress-circular></div>'
      },
      error: {
        template: '<div class="text-center pa-4 error--text">Erro ao carregar componente</div>'
      },
      delay: 200,
      timeout: 10000
    })
  },

  // Preload de rotas
  preloadRoute(routeName) {
    const router = this.$router
    if (router) {
      const route = router.resolve({ name: routeName })
      if (route.matched.length > 0) {
        route.matched.forEach(match => {
          if (match.components) {
            Object.values(match.components).forEach(component => {
              if (typeof component === 'function') {
                component()
              }
            })
          }
        })
      }
    }
  }
}

// Otimização de rede
export const networkOptimizer = {
  // Detectar tipo de conexão
  getConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType
    }
    return 'unknown'
  },

  // Verificar se é conexão lenta
  isSlowConnection() {
    const connectionType = this.getConnectionType()
    return ['slow-2g', '2g'].includes(connectionType)
  },

  // Verificar se deve economizar dados
  shouldSaveData() {
    if ('connection' in navigator) {
      return navigator.connection.saveData
    }
    return false
  },

  // Otimizar requisições baseado na conexão
  optimizeRequest(config) {
    if (this.isSlowConnection() || this.shouldSaveData()) {
      // Reduzir timeout para conexões lentas
      config.timeout = 5000
      
      // Adicionar headers para economizar dados
      config.headers = {
        ...config.headers,
        'Save-Data': 'on'
      }
    }
    
    return config
  }
}

// Inicialização das otimizações
export const initPerformanceOptimizations = () => {
  // Preload de recursos críticos
  preloadCriticalResources()
  
  // Lazy loading de imagens
  lazyLoadImages()
  
  // Log de métricas de performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logMetrics()
    }, 1000)
  })
  
  // Otimizar scroll performance
  let ticking = false
  const optimizedScroll = throttle(() => {
    lazyLoadImages()
    ticking = false
  }, 100)
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(optimizedScroll)
      ticking = true
    }
  })
}

