<template>
  <v-app>
    <!-- Indicador de conexão -->
    <div 
      v-if="!appStore.isOnline" 
      class="connection-indicator"
    >
      <v-icon small class="mr-1">mdi-wifi-off</v-icon>
      Sem conexão com a internet
    </div>

    <!-- Loading global -->
    <div v-if="appStore.isLoading" class="loading-overlay">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
    </div>

    <!-- Layout principal -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Navegação inferior (mobile-first) -->
    <v-bottom-navigation
      v-if="showNavigation"
      v-model="currentRoute"
      class="bottom-navigation"
      grow
      shift
      color="primary"
    >
      <v-btn
        v-for="route in mainRoutes"
        :key="route.name"
        :value="route.name"
        @click="$router.push({ name: route.name })"
      >
        <v-icon>{{ route.meta.icon }}</v-icon>
        <span>{{ route.meta.title }}</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Snackbar para mensagens -->
    <v-snackbar
      v-model="appStore.snackbar.show"
      :color="appStore.snackbar.color"
      :timeout="appStore.snackbar.timeout"
      location="top"
    >
      {{ appStore.snackbar.message }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="appStore.hideSnackbar()"
        >
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './store/app'
import { useAuthStore } from './store/auth'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const appStore = useAppStore()
    const authStore = useAuthStore()

    // Rotas principais para navegação inferior
    const mainRoutes = [
      { name: 'Home', meta: { title: 'Início', icon: 'mdi-home' } },
      { name: 'Produtos', meta: { title: 'Produtos', icon: 'mdi-package-variant' } },
      { name: 'Cestas', meta: { title: 'Cestas', icon: 'mdi-basket' } },
      { name: 'Pedidos', meta: { title: 'Pedidos', icon: 'mdi-clipboard-list' } },
      { name: 'Perfil', meta: { title: 'Perfil', icon: 'mdi-account' } }
    ]

    const currentRoute = computed({
      get: () => route.name,
      set: () => {} // Navegação é feita pelo click do botão
    })

    // Mostrar navegação apenas se estiver autenticado e não estiver na página de login
    const showNavigation = computed(() => {
      return authStore.isAuthenticated && route.name !== 'Login'
    })

    onMounted(() => {
      // Inicializar store da aplicação
      appStore.init()
    })

    return {
      appStore,
      mainRoutes,
      currentRoute,
      showNavigation
    }
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.connection-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #FF9800;
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 0.875rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-navigation {
  border-top: 1px solid #e0e0e0;
}
</style>

