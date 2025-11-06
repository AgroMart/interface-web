<template>
  <DefaultLayout>
    <div class="home-page">
      <!-- Cabeçalho de boas-vindas -->
      <v-card class="welcome-card mb-6" color="primary" dark>
        <v-card-text class="pa-6">
          <div class="d-flex align-center">
            <div class="flex-grow-1">
              <h2 class="text-h5 font-weight-bold mb-2">
                Olá! Bem-vindo ao AgroMart
              </h2>
              <p class="text-body-1 mb-0">
                Gerencie seus produtos e cestas de forma simples
              </p>
            </div>
            <v-icon size="64" class="ml-4">
              mdi-leaf
            </v-icon>
          </div>
        </v-card-text>
      </v-card>

      <!-- Cards de resumo -->
      <v-row class="mb-6">
        <v-col cols="6" md="3">
          <v-card class="summary-card text-center" elevation="2">
            <v-card-text class="pa-4">
              <v-icon size="40" color="success" class="mb-2">
                mdi-package-variant
              </v-icon>
              <div class="text-h6 font-weight-bold">
                {{ productStore.products.length }}
              </div>
              <div class="text-caption text-grey-darken-1">
                Produtos
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="summary-card text-center" elevation="2">
            <v-card-text class="pa-4">
              <v-icon size="40" color="orange" class="mb-2">
                mdi-basket
              </v-icon>
              <div class="text-h6 font-weight-bold">
                {{ basketStore.baskets.length }}
              </div>
              <div class="text-caption text-grey-darken-1">
                Cestas
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="summary-card text-center" elevation="2">
            <v-card-text class="pa-4">
              <v-icon size="40" color="info" class="mb-2">
                mdi-clipboard-list
              </v-icon>
              <div class="text-h6 font-weight-bold">
                0
              </div>
              <div class="text-caption text-grey-darken-1">
                Pedidos
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="summary-card text-center" elevation="2">
            <v-card-text class="pa-4">
              <v-icon size="40" color="primary" class="mb-2">
                mdi-store
              </v-icon>
              <div class="text-h6 font-weight-bold">
                {{ storeStore.stores.length }}
              </div>
              <div class="text-caption text-grey-darken-1">
                Lojas
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Ações rápidas -->
      <v-card class="mb-6" elevation="2">
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
          Ações Rápidas
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="6" md="3">
              <v-btn
                color="success"
                variant="outlined"
                block
                size="large"
                class="quick-action-btn"
                @click="$router.push({ name: 'Produtos' })"
              >
                <v-icon class="mb-1">mdi-plus</v-icon>
                <br>
                <span class="text-caption">Novo Produto</span>
              </v-btn>
            </v-col>

            <v-col cols="6" md="3">
              <v-btn
                color="orange"
                variant="outlined"
                block
                size="large"
                class="quick-action-btn"
                @click="$router.push({ name: 'Cestas' })"
              >
                <v-icon class="mb-1">mdi-basket-plus</v-icon>
                <br>
                <span class="text-caption">Nova Cesta</span>
              </v-btn>
            </v-col>

            <v-col cols="6" md="3">
              <v-btn
                color="info"
                variant="outlined"
                block
                size="large"
                class="quick-action-btn"
                @click="$router.push({ name: 'Pedidos' })"
              >
                <v-icon class="mb-1">mdi-eye</v-icon>
                <br>
                <span class="text-caption">Ver Pedidos</span>
              </v-btn>
            </v-col>

            <v-col cols="6" md="3">
              <v-btn
                color="primary"
                variant="outlined"
                block
                size="large"
                class="quick-action-btn"
                @click="$router.push({ name: 'Loja' })"
              >
                <v-icon class="mb-1">mdi-store-edit</v-icon>
                <br>
                <span class="text-caption">Editar Loja</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Produtos recentes -->
      <v-card v-if="recentProducts.length > 0" class="mb-6" elevation="2">
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon class="mr-2">mdi-clock-outline</v-icon>
          Produtos Recentes
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-row>
            <v-col
              v-for="product in recentProducts"
              :key="product.id"
              cols="12"
              sm="6"
              md="4"
            >
              <ProductCard
                :product="product"
                @click="goToProduct"
                @edit="editProduct"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Dicas para agricultores -->
      <v-card class="tips-card" elevation="2">
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
          Dicas para Você
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-list>
            <v-list-item
              v-for="tip in tips"
              :key="tip.id"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-icon :color="tip.color">{{ tip.icon }}</v-icon>
              </template>
              
              <v-list-item-title class="text-body-1">
                {{ tip.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-body-2">
                {{ tip.description }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>
  </DefaultLayout>
</template>

<script>
import { computed, onMounted } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import ProductCard from '../components/ProductCard.vue'
import { useProductStore } from '../store/products'
import { useStoreStore } from '../store/stores'
import { useBasketStore } from '../store/baskets'

export default {
  name: 'HomePage',
  components: {
    DefaultLayout,
    ProductCard
  },
  setup() {
    const productStore = useProductStore()
    const storeStore = useStoreStore()
    const basketStore = useBasketStore()

    // Produtos recentes (últimos 3)
    const recentProducts = computed(() => {
      return productStore.products.slice(0, 3)
    })

    // Dicas para agricultores
    const tips = [
      {
        id: 1,
        icon: 'mdi-camera',
        color: 'success',
        title: 'Tire fotos atrativas',
        description: 'Fotos bem iluminadas aumentam as vendas dos seus produtos'
      },
      {
        id: 2,
        icon: 'mdi-text-box',
        color: 'info',
        title: 'Descreva bem seus produtos',
        description: 'Conte como são cultivados e seus benefícios'
      },
      {
        id: 3,
        icon: 'mdi-update',
        color: 'warning',
        title: 'Mantenha estoque atualizado',
        description: 'Atualize as quantidades para evitar problemas'
      },
      {
        id: 4,
        icon: 'mdi-heart',
        color: 'error',
        title: 'Atenda bem seus clientes',
        description: 'Um bom atendimento gera clientes fiéis'
      }
    ]

    const goToProduct = (product) => {
      // Navegar para detalhes do produto
      console.log('Ver produto:', product)
    }

    const editProduct = (product) => {
      // Navegar para edição do produto
      console.log('Editar produto:', product)
    }

    onMounted(async () => {
      // Carregar dados iniciais
      await Promise.all([
        productStore.fetchProducts(true), // Usar cache se disponível
        storeStore.fetchStores(true),
        basketStore.fetchBaskets(true)
      ])
    })

    return {
      productStore,
      storeStore,
      basketStore,
      recentProducts,
      tips,
      goToProduct,
      editProduct
    }
  }
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
}

.summary-card {
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.quick-action-btn {
  height: 80px !important;
  flex-direction: column !important;
  text-transform: none !important;
}

.tips-card .v-list-item {
  border-radius: 8px;
  margin-bottom: 8px;
}

.tips-card .v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Responsividade */
@media (max-width: 600px) {
  .welcome-card .v-card-text {
    padding: 16px !important;
  }
  
  .welcome-card .v-icon {
    display: none;
  }
  
  .quick-action-btn {
    height: 70px !important;
  }
}
</style>

