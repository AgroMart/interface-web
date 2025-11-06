// Service Worker para AgroMart
// Implementa cache de assets e estratégias offline

const CACHE_NAME = 'agromart-v1'
const STATIC_CACHE = 'agromart-static-v1'
const DYNAMIC_CACHE = 'agromart-dynamic-v1'

// Assets estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// URLs da API para cache
const API_URLS = [
  '/api/produto-avulsos',
  '/api/lojas',
  '/api/cestas',
  '/api/planos',
  '/api/assinantes'
]

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Cache estático criado')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch(err => console.log('Erro ao criar cache estático:', err))
  )
})

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remover caches antigos
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptar requisições
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Estratégia para assets estáticos: Cache First
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request)
        })
    )
    return
  }

  // Estratégia para API: Network First com fallback para cache
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Se a requisição foi bem-sucedida, salvar no cache
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Se falhou, tentar buscar no cache
          return caches.match(request)
            .then(response => {
              if (response) {
                return response
              }
              // Se não tem no cache, retornar resposta offline
              return new Response(
                JSON.stringify({
                  error: 'Sem conexão',
                  message: 'Dados não disponíveis offline',
                  offline: true
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            })
        })
    )
    return
  }

  // Estratégia padrão: Network First
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Sincronização em background
self.addEventListener('sync', event => {
  console.log('Service Worker: Sincronização em background')
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implementar lógica de sincronização
      syncData()
    )
  }
})

// Função para sincronizar dados
async function syncData() {
  try {
    // Buscar dados pendentes no IndexedDB
    const pendingData = await getPendingData()
    
    // Enviar dados pendentes para a API
    for (const data of pendingData) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        })
        
        // Remover dados sincronizados
        await removePendingData(data.id)
      } catch (error) {
        console.log('Erro ao sincronizar:', error)
      }
    }
  } catch (error) {
    console.log('Erro na sincronização:', error)
  }
}

// Funções auxiliares para IndexedDB (implementação simplificada)
async function getPendingData() {
  // Implementar busca no IndexedDB
  return []
}

async function removePendingData(id) {
  // Implementar remoção no IndexedDB
  console.log('Removendo dados sincronizados:', id)
}

// Notificações push (se necessário)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalhes',
          icon: '/icon-explore.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icon-close.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Clique em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'explore') {
    // Abrir aplicação
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

