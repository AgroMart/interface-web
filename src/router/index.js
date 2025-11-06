import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue'),
    meta: {
      title: 'Início',
      icon: 'mdi-home',
      requiresAuth: true
    }
  },
  {
    path: '/produtos',
    name: 'Produtos',
    component: () => import('../pages/ProductsPage.vue'),
    meta: {
      title: 'Meus Produtos',
      icon: 'mdi-package-variant',
      requiresAuth: true
    }
  },
  {
    path: '/cestas',
    name: 'Cestas',
    component: () => import('../pages/BasketsPage.vue'),
    meta: {
      title: 'Cestas',
      icon: 'mdi-basket',
      requiresAuth: true
    }
  },
  {
    path: '/pedidos',
    name: 'Pedidos',
    component: () => import('../pages/OrdersPage.vue'),
    meta: {
      title: 'Pedidos',
      icon: 'mdi-clipboard-list',
      requiresAuth: true
    }
  },
  {
    path: '/loja',
    name: 'Loja',
    component: () => import('../pages/StorePage.vue'),
    meta: {
      title: 'Minha Loja',
      icon: 'mdi-store',
      requiresAuth: true
    }
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('../pages/ProfilePage.vue'),
    meta: {
      title: 'Meu Perfil',
      icon: 'mdi-account',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Guarda de rotas para autenticação
router.beforeEach(async (to, from, next) => {
  // Atualizar título da página
  document.title = to.meta.title ? `${to.meta.title} - AgroMart` : 'AgroMart'
  
  // Importar store de autenticação
  const { useAuthStore } = await import('@/store/auth')
  const authStore = useAuthStore()
  
  // Inicializar autenticação se ainda não foi feito
  if (!authStore.isAuthenticated && localStorage.getItem('agromart_token')) {
    await authStore.initAuth()
  }
  
  // Verificar se a rota requer autenticação
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated
  
  if (requiresAuth && !isAuthenticated) {
    // Redirecionar para login se não autenticado
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isAuthenticated) {
    // Redirecionar para home se já autenticado e tentando acessar login
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

