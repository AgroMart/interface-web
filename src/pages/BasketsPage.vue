<template>
  <DefaultLayout>
    <div class="baskets-page">
      <!-- Cabeçalho da página -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">
            Minhas Cestas
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Organize produtos em cestas semanais
          </p>
        </div>
        
        <v-btn
          color="primary"
          size="large"
          @click="showCreateDialog = true"
        >
          <v-icon class="mr-2">mdi-plus</v-icon>
          Nova Cesta
        </v-btn>
      </div>

      <!-- Filtros e busca -->
      <v-card class="mb-4" elevation="1">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="searchQuery"
                label="Buscar cestas"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-select
                v-model="statusFilter"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Ordenar por"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Lista de cestas -->
      <div v-if="basketStore.loading && basketStore.baskets.length === 0">
        <v-row>
          <v-col
            v-for="n in 6"
            :key="n"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <LoadingCard />
          </v-col>
        </v-row>
      </div>

      <div v-else-if="filteredBaskets.length === 0">
        <EmptyState
          icon="mdi-basket-outline"
          title="Nenhuma cesta encontrada"
          :description="searchQuery ? 'Tente buscar com outros termos' : 'Comece criando sua primeira cesta semanal'"
          :action-text="searchQuery ? null : 'Criar Cesta'"
          action-icon="mdi-plus"
          @action="showCreateDialog = true"
        />
      </div>

      <v-row v-else>
        <v-col
          v-for="basket in filteredBaskets"
          :key="basket.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <BasketCard
            :basket="basket"
            @click="viewBasket"
            @edit="editBasket"
          />
        </v-col>
      </v-row>

      <!-- Dialog de criação/edição de cesta -->
      <v-dialog
        v-model="showCreateDialog"
        max-width="600"
        persistent
      >
        <BasketForm
          :basket="selectedBasket"
          @save="handleSaveBasket"
          @cancel="handleCancelBasket"
        />
      </v-dialog>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import BasketCard from '../components/BasketCard.vue'
import LoadingCard from '../components/LoadingCard.vue'
import EmptyState from '../components/EmptyState.vue'
import BasketForm from '../components/BasketForm.vue'
import { useBasketStore } from '../store/baskets'

export default {
  name: 'BasketsPage',
  components: {
    DefaultLayout,
    BasketCard,
    LoadingCard,
    EmptyState,
    BasketForm
  },
  setup() {
    const basketStore = useBasketStore()
    
    // Estado local
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const sortBy = ref('price')
    const showCreateDialog = ref(false)
    const selectedBasket = ref(null)

    // Opções de filtro
    const statusOptions = [
      { title: 'Todas', value: 'all' },
      { title: 'Disponível', value: 'available' },
      { title: 'Esgotado', value: 'out_of_stock' },
      { title: 'Pouco estoque', value: 'low_stock' }
    ]

    const sortOptions = [
      { title: 'Preço (menor)', value: 'price_asc' },
      { title: 'Preço (maior)', value: 'price_desc' },
      { title: 'Quantidade', value: 'quantity' }
    ]

    // Cestas filtradas
    const filteredBaskets = computed(() => {
      let baskets = [...basketStore.baskets]

      // Filtro por busca
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        baskets = baskets.filter(basket =>
          basket.descricao?.toLowerCase().includes(query)
        )
      }

      // Filtro por status
      if (statusFilter.value !== 'all') {
        baskets = baskets.filter(basket => {
          const quantity = basket.quantidade
          switch (statusFilter.value) {
            case 'available':
              return quantity > 0
            case 'out_of_stock':
              return quantity === 0
            case 'low_stock':
              return quantity > 0 && quantity <= 5
            default:
              return true
          }
        })
      }

      // Ordenação
      baskets.sort((a, b) => {
        switch (sortBy.value) {
          case 'price_asc':
            return (a.attributes.valor || 0) - (b.attributes.valor || 0)
          case 'price_desc':
            return (b.attributes.valor || 0) - (a.attributes.valor || 0)
          case 'quantity':
            return (b.attributes.quantidade || 0) - (a.attributes.quantidade || 0)
          default:
            return 0
        }
      })

      return baskets
    })

    // Ações
    const viewBasket = (basket) => {
      console.log('Ver cesta:', basket)
      // Implementar visualização detalhada
    }

    const editBasket = (basket) => {
      selectedBasket.value = basket
      showCreateDialog.value = true
    }

    const handleSaveBasket = async (basketData) => {
      try {
        if (selectedBasket.value) {
          // Editar cesta existente
          await basketStore.updateBasket(selectedBasket.value.id, basketData)
        } else {
          // Criar nova cesta
          await basketStore.createBasket(basketData)
        }
        
        showCreateDialog.value = false
        selectedBasket.value = null
      } catch (error) {
        console.error('Erro ao salvar cesta:', error)
      }
    }

    const handleCancelBasket = () => {
      showCreateDialog.value = false
      selectedBasket.value = null
    }

    onMounted(async () => {
      // Carregar cestas
      await basketStore.fetchBaskets()
    })

    return {
      basketStore,
      searchQuery,
      statusFilter,
      sortBy,
      showCreateDialog,
      selectedBasket,
      statusOptions,
      sortOptions,
      filteredBaskets,
      viewBasket,
      editBasket,
      handleSaveBasket,
      handleCancelBasket
    }
  }
}
</script>

<style scoped>
.baskets-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsividade */
@media (max-width: 960px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

