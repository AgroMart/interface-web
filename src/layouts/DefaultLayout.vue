<template>
  <div class="default-layout">
    <!-- Header com título da página -->
    <v-app-bar
      color="primary"
      dark
      elevation="2"
      height="64"
    >
      <v-app-bar-title class="text-h6 font-weight-bold">
        {{ pageTitle }}
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Indicador de sincronização -->
      <v-btn
        v-if="!appStore.isOnline"
        icon
        size="small"
        color="warning"
      >
        <v-icon>mdi-cloud-off-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Modo offline - dados salvos localmente
        </v-tooltip>
      </v-btn>

      <!-- Menu de opções -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="refreshData">
            <v-list-item-title>
              <v-icon class="mr-2">mdi-refresh</v-icon>
              Atualizar dados
            </v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="clearCache">
            <v-list-item-title>
              <v-icon class="mr-2">mdi-delete-sweep</v-icon>
              Limpar cache
            </v-list-item-title>
          </v-list-item>

          <v-divider class="my-2"></v-divider>
          
          <v-list-item @click="handleLogout">
            <v-list-item-title>
              <v-icon class="mr-2" color="error">mdi-logout</v-icon>
              Sair
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Conteúdo principal -->
    <v-main>
      <v-container fluid class="pa-4">
        <slot />
      </v-container>
    </v-main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import { useAuthStore } from '../store/auth'
import { useProductStore } from '../store/products'
import { useStoreStore } from '../store/stores'
import { useBasketStore } from '../store/baskets'

export default {
  name: 'DefaultLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const appStore = useAppStore()
    const authStore = useAuthStore()
    const productStore = useProductStore()
    const storeStore = useStoreStore()
    const basketStore = useBasketStore()

    const pageTitle = computed(() => {
      return route.meta?.title || 'AgroMart'
    })

    const refreshData = async () => {
      try {
        await Promise.all([
          productStore.fetchProducts(),
          storeStore.fetchStores(),
          basketStore.fetchBaskets()
        ])
        appStore.showSnackbar('Dados atualizados com sucesso', 'success')
      } catch (error) {
        appStore.showSnackbar('Erro ao atualizar dados', 'error')
      }
    }

    const clearCache = () => {
      productStore.clearCache()
      storeStore.clearCache()
      basketStore.clearCache()
      appStore.showSnackbar('Cache limpo com sucesso', 'success')
    }

    const handleLogout = () => {
      authStore.logout()
      router.push('/login')
      appStore.showSnackbar('Logout realizado com sucesso', 'success')
    }

    return {
      appStore,
      pageTitle,
      refreshData,
      clearCache,
      handleLogout
    }
  }
}
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
}
</style>

