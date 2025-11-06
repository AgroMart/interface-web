<template>
  <DefaultLayout>
    <div class="orders-page">
      <!-- Cabeçalho da página -->
      <div class="mb-4">
        <h1 class="text-h5 font-weight-bold mb-1">
          Meus Pedidos
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Acompanhe os pedidos dos seus clientes
        </p>
      </div>

      <!-- Filtros -->
      <v-card class="mb-4" elevation="1">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                label="Buscar pedidos"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="statusFilter"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="periodFilter"
                :items="periodOptions"
                label="Período"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Lista de pedidos -->
      <div v-if="loading">
        <v-row>
          <v-col
            v-for="n in 4"
            :key="n"
            cols="12"
          >
            <v-skeleton-loader
              type="list-item-three-line"
              class="mb-4"
            ></v-skeleton-loader>
          </v-col>
        </v-row>
      </div>

      <div v-else-if="filteredOrders.length === 0">
        <EmptyState
          icon="mdi-clipboard-list-outline"
          title="Nenhum pedido encontrado"
          :description="searchQuery ? 'Tente buscar com outros termos' : 'Você ainda não recebeu pedidos'"
          :action-text="null"
        />
      </div>

      <div v-else>
        <v-card
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card mb-4"
          elevation="2"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <h3 class="text-h6 font-weight-bold">
                  Pedido #{{ order.id }}
                </h3>
                <p class="text-body-2 text-grey-darken-1 mb-0">
                  {{ formatDate(order.createdAt) }}
                </p>
              </div>
              
              <v-chip
                :color="getStatusColor(order.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </div>

            <v-divider class="mb-3"></v-divider>

            <!-- Informações do cliente -->
            <div class="mb-3">
              <div class="d-flex align-center mb-2">
                <v-icon size="small" class="mr-2" color="grey-darken-1">
                  mdi-account
                </v-icon>
                <span class="text-body-1 font-weight-medium">
                  {{ order.customer.name }}
                </span>
              </div>
              
              <div class="d-flex align-center mb-2">
                <v-icon size="small" class="mr-2" color="grey-darken-1">
                  mdi-phone
                </v-icon>
                <span class="text-body-2 text-grey-darken-1">
                  {{ order.customer.phone }}
                </span>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2" color="grey-darken-1">
                  mdi-map-marker
                </v-icon>
                <span class="text-body-2 text-grey-darken-1">
                  {{ order.customer.address }}
                </span>
              </div>
            </div>

            <v-divider class="mb-3"></v-divider>

            <!-- Itens do pedido -->
            <div class="mb-3">
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Itens do pedido:
              </h4>
              
              <div
                v-for="item in order.items"
                :key="item.id"
                class="d-flex align-center justify-space-between mb-2"
              >
                <div class="flex-grow-1">
                  <span class="text-body-1">{{ item.name }}</span>
                  <span class="text-body-2 text-grey-darken-1 ml-2">
                    x{{ item.quantity }}
                  </span>
                </div>
                
                <span class="text-body-1 font-weight-medium">
                  R$ {{ formatPrice(item.total) }}
                </span>
              </div>
            </div>

            <v-divider class="mb-3"></v-divider>

            <!-- Total e ações -->
            <div class="d-flex align-center justify-space-between">
              <div>
                <span class="text-h6 font-weight-bold text-primary">
                  Total: R$ {{ formatPrice(order.total) }}
                </span>
              </div>
              
              <div class="d-flex gap-2">
                <v-btn
                  v-if="order.status === 'pending'"
                  color="success"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'confirmed')"
                >
                  <v-icon class="mr-1">mdi-check</v-icon>
                  Confirmar
                </v-btn>
                
                <v-btn
                  v-if="order.status === 'confirmed'"
                  color="info"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'preparing')"
                >
                  <v-icon class="mr-1">mdi-package-variant</v-icon>
                  Preparar
                </v-btn>
                
                <v-btn
                  v-if="order.status === 'preparing'"
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'ready')"
                >
                  <v-icon class="mr-1">mdi-truck</v-icon>
                  Pronto
                </v-btn>
                
                <v-btn
                  color="grey"
                  variant="outlined"
                  size="small"
                  @click="viewOrderDetails(order)"
                >
                  <v-icon class="mr-1">mdi-eye</v-icon>
                  Detalhes
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import { useAppStore } from '../store/app'

export default {
  name: 'OrdersPage',
  components: {
    DefaultLayout,
    EmptyState
  },
  setup() {
    const appStore = useAppStore()
    
    // Estado local
    const loading = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const periodFilter = ref('all')

    // Dados mock dos pedidos (em produção viria da API)
    const orders = ref([
      {
        id: '001',
        createdAt: '2025-01-15T10:30:00Z',
        status: 'pending',
        customer: {
          name: 'Maria Silva',
          phone: '(61) 99999-9999',
          address: 'Rua das Flores, 123 - Brasília/DF'
        },
        items: [
          { id: 1, name: 'Tomate Orgânico', quantity: 2, total: 12.00 },
          { id: 2, name: 'Alface Crespa', quantity: 1, total: 4.50 }
        ],
        total: 16.50
      },
      {
        id: '002',
        createdAt: '2025-01-14T15:45:00Z',
        status: 'confirmed',
        customer: {
          name: 'João Santos',
          phone: '(61) 88888-8888',
          address: 'Av. Principal, 456 - Brasília/DF'
        },
        items: [
          { id: 3, name: 'Cesta Semanal', quantity: 1, total: 35.00 }
        ],
        total: 35.00
      },
      {
        id: '003',
        createdAt: '2025-01-13T09:15:00Z',
        status: 'completed',
        customer: {
          name: 'Ana Costa',
          phone: '(61) 77777-7777',
          address: 'Quadra 10, Casa 5 - Brasília/DF'
        },
        items: [
          { id: 4, name: 'Cenoura', quantity: 1, total: 3.50 },
          { id: 5, name: 'Beterraba', quantity: 2, total: 8.00 }
        ],
        total: 11.50
      }
    ])

    // Opções de filtro
    const statusOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Pendente', value: 'pending' },
      { title: 'Confirmado', value: 'confirmed' },
      { title: 'Preparando', value: 'preparing' },
      { title: 'Pronto', value: 'ready' },
      { title: 'Entregue', value: 'completed' },
      { title: 'Cancelado', value: 'cancelled' }
    ]

    const periodOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Hoje', value: 'today' },
      { title: 'Esta semana', value: 'week' },
      { title: 'Este mês', value: 'month' }
    ]

    // Pedidos filtrados
    const filteredOrders = computed(() => {
      let filtered = [...orders.value]

      // Filtro por busca
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(order =>
          order.id.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query)
        )
      }

      // Filtro por status
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter.value)
      }

      // Filtro por período
      if (periodFilter.value !== 'all') {
        const now = new Date()
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt)
          switch (periodFilter.value) {
            case 'today': {
              return orderDate.toDateString() === now.toDateString()
            }
            case 'week': {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              return orderDate >= weekAgo
            }
            case 'month': {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              return orderDate >= monthAgo
            }
            default:
              return true
          }
        })
      }

      // Ordenar por data (mais recente primeiro)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return filtered
    })

    // Funções auxiliares
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      return price.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'primary',
        ready: 'success',
        completed: 'success',
        cancelled: 'error'
      }
      return colors[status] || 'grey'
    }

    const getStatusText = (status) => {
      const texts = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        preparing: 'Preparando',
        ready: 'Pronto',
        completed: 'Entregue',
        cancelled: 'Cancelado'
      }
      return texts[status] || status
    }

    // Ações
    const updateOrderStatus = (orderId, newStatus) => {
      const order = orders.value.find(o => o.id === orderId)
      if (order) {
        order.status = newStatus
        appStore.showSnackbar(`Pedido #${orderId} atualizado para ${getStatusText(newStatus)}`, 'success')
      }
    }

    const viewOrderDetails = (order) => {
      console.log('Ver detalhes do pedido:', order)
      // Implementar visualização detalhada
    }

    onMounted(() => {
      // Em produção, carregar pedidos da API
      loading.value = false
    })

    return {
      loading,
      searchQuery,
      statusFilter,
      periodFilter,
      statusOptions,
      periodOptions,
      filteredOrders,
      formatDate,
      formatPrice,
      getStatusColor,
      getStatusText,
      updateOrderStatus,
      viewOrderDetails
    }
  }
}
</script>

<style scoped>
.orders-page {
  max-width: 1200px;
  margin: 0 auto;
}

.order-card {
  transition: transform 0.2s ease;
}

.order-card:hover {
  transform: translateY(-1px);
}

/* Responsividade */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .d-flex.gap-2 {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>

