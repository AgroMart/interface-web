<template>
  <DefaultLayout>
    <div class="products-page">
      <!-- Cabeçalho da página -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">
            Meus Produtos
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Gerencie seus produtos de forma simples
          </p>
        </div>
        
        <v-btn
          color="primary"
          size="large"
          @click="showCreateDialog = true"
        >
          <v-icon class="mr-2">mdi-plus</v-icon>
          Novo Produto
        </v-btn>
      </div>

      <!-- Filtros e busca -->
      <v-card class="mb-4" elevation="1">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="searchQuery"
                label="Buscar produtos"
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

      <!-- Lista de produtos -->
      <div v-if="productStore.loading && productStore.products.length === 0">
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

      <div v-else-if="filteredProducts.length === 0">
        <EmptyState
          icon="mdi-package-variant-closed"
          title="Nenhum produto encontrado"
          :description="searchQuery ? 'Tente buscar com outros termos' : 'Comece criando seu primeiro produto'"
          :action-text="searchQuery ? null : 'Criar Produto'"
          action-icon="mdi-plus"
          @action="showCreateDialog = true"
        />
      </div>

      <v-row v-else>
        <v-col
          v-for="product in filteredProducts"
          :key="product.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <ProductCard
            :product="product"
            @click="viewProduct"
            @edit="editProduct"
          />
        </v-col>
      </v-row>

      <!-- Dialog de criação/edição de produto -->
      <v-dialog
        v-model="showCreateDialog"
        max-width="600"
        persistent
      >
        <ProductForm
          :product="selectedProduct"
          @save="handleSaveProduct"
          @cancel="handleCancelProduct"
        />
      </v-dialog>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed,/* onMounted,*/ onBeforeMount } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import ProductCard from '../components/ProductCard.vue'
import LoadingCard from '../components/LoadingCard.vue'
import EmptyState from '../components/EmptyState.vue'
import ProductForm from '../components/ProductForm.vue'
import { useProductStore } from '../store/products'

export default {
  name: 'ProductsPage',
  components: {
    DefaultLayout,
    ProductCard,
    LoadingCard,
    EmptyState,
    ProductForm
  },
  setup() {
    const productStore = useProductStore()
    
    // Estado local
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const sortBy = ref('name')
    const showCreateDialog = ref(false)
    const selectedProduct = ref(null)

    // Opções de filtro
    const statusOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Disponível', value: 'available' },
      { title: 'Esgotado', value: 'out_of_stock' },
      { title: 'Pouco estoque', value: 'low_stock' }
    ]

    const sortOptions = [
      { title: 'Nome', value: 'name' },
      { title: 'Preço (menor)', value: 'price_asc' },
      { title: 'Preço (maior)', value: 'price_desc' },
      { title: 'Quantidade', value: 'quantity' }
    ]

    // Produtos filtrados
    const filteredProducts = computed(() => {
      let products = [...productStore.products]

      // Filtro por busca
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        products = products.filter(product =>
          product.nome.toLowerCase().includes(query) || // product.attributes -> product
          product.descricao?.toLowerCase().includes(query)
        )
      }

      // Filtro por status
      if (statusFilter.value !== 'all') {
        products = products.filter(product => {
          const quantity = product.quantidade  // era product.attributes virou product
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
      // colocar ordenação por data de criação
      products.sort((a, b) => {
        switch (sortBy.value) {
          case 'name':
            return a.nome.localeCompare(b.nome)  // era tudo a e b.attributes -> saiu attributes
          case 'price_asc':
            return (a.valor || 0) - (b.valor || 0)
          case 'price_desc':
            return (b.valor || 0) - (a.valor || 0)
          case 'quantity':
            return (b.quantidade || 0) - (a.quantidade || 0)
          default:
            return 0
        }
      })

      return products
    })

    // Ações
    const viewProduct = (product) => {
      console.log('Ver produto:', product)
      // Implementar visualização detalhada
    }

    const editProduct = (product) => {
      selectedProduct.value = product
      showCreateDialog.value = true
    }

    const handleSaveProduct = async (productData) => {
      try {
        if (selectedProduct.value) {
          // Editar produto existente
          await productStore.updateProduct(selectedProduct.value.id, productData)
        } else {
          // Criar novo produto
          await productStore.createProduct(productData)
        }
        
        showCreateDialog.value = false
        selectedProduct.value = null
      } catch (error) {
        console.error('Erro ao salvar produto:', error)
      }
    }

    const handleCancelProduct = () => {
      showCreateDialog.value = false
      selectedProduct.value = null
    }

    // onMounted(async () => {  // estava assim antes
    onBeforeMount(async () => {
      // Carregar produtos
      await productStore.fetchProducts()
    })

    return {
      productStore,
      searchQuery,
      statusFilter,
      sortBy,
      showCreateDialog,
      selectedProduct,
      statusOptions,
      sortOptions,
      filteredProducts,
      viewProduct,
      editProduct,
      handleSaveProduct,
      handleCancelProduct
    }
  }
}
</script>

<style scoped>
.products-page {
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

