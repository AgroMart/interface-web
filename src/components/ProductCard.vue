<template>
  <v-card
    class="product-card"
    elevation="2"
    @click="$emit('click', product)"
  >
    <!-- Imagem do produto -->
    <div class="product-image-container">
      <v-img
        :src="productImage"
        :alt="product.nome"
        height="200"
        cover
        class="product-image"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-icon size="64" color="grey-lighten-2">
              mdi-image-outline
            </v-icon>
          </div>
        </template>
      </v-img>

      <!-- Badge de quantidade -->
      <v-chip
        v-if="product.quantidade <= 5"
        :color="product.quantidade === 0 ? 'error' : 'warning'"
        size="small"
        class="quantity-badge"
      >
        {{ product.quantidade === 0 ? 'Esgotado' : `${product.quantidade} restantes` }}
      </v-chip>
    </div>

    <!-- Conteúdo do card -->
    <v-card-text class="pa-4">
      <h3 class="text-h6 font-weight-bold mb-2">
        {{ product.nome }}
      </h3>

      <p v-if="product.descricao" class="text-body-2 text-grey-darken-1 mb-3">
        {{ truncatedDescription }}
      </p>

      <!-- Preço e unidade -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="price-container">
          <span class="text-h6 font-weight-bold text-primary">
            R$ {{ formatPrice(product.valor) }}
          </span>
          <span v-if="product.unidade_medida" class="text-caption text-grey-darken-1 ml-1">
            / {{ product.unidade_medida }}
          </span>
        </div>

        <v-chip
          :color="product.quantidade > 0 ? 'success' : 'error'"
          size="small"
          variant="tonal"
        >
          {{ product.quantidade > 0 ? 'Disponível' : 'Indisponível' }}
        </v-chip>
      </div>

      <!-- Informações da loja -->
      <div v-if="product.loja?.data" class="store-info">
        <v-divider class="mb-2"></v-divider>
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-1" color="grey-darken-1">
            mdi-store
          </v-icon>
          <span class="text-caption text-grey-darken-1">
            {{ product.loja.data.attributes.nome }}
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- Ações do card -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
        color="primary"
        variant="outlined"
        block
        size="large"
        :disabled="product.quantidade === 0"
        @click.stop="$emit('edit', product)"
      >
        <v-icon class="mr-2">mdi-pencil</v-icon>
        Editar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { computed } from 'vue'

import logo from '@/assets/logo.png' // teste para inserir imagem de placeholder


export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  emits: ['click', 'edit'],
  setup(props) {
    const productImage = computed(() => {
      const image = props.product?.attributes?.imagem?.data
      if (image) {
        // Se for URL completa, usar diretamente
        if (image.attributes.url.startsWith('http')) {
          return image.attributes.url
        }
        // Se for path relativo, construir URL completa
        const baseUrl = process.env.VUE_APP_STRAPI_URL || 'http://localhost:1337'
        return `${baseUrl}${image.attributes.url}`
      }
      // Imagem placeholder
      // return '/placeholder-product.jpg'
      return logo // uso de imagem teste
    })

    const truncatedDescription = computed(() => {
      const desc = props.product.descricao
      if (!desc) return ''
      return desc.length > 100 ? `${desc.substring(0, 100)}...` : desc
    })

    const formatPrice = (price) => {
      if (!price) return '0,00'
      return price.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    return {
      productImage,
      truncatedDescription,
      formatPrice
    }
  }
}
</script>

<style scoped>
.product-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.product-image-container {
  position: relative;
}

.quantity-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.price-container {
  display: flex;
  align-items: baseline;
}

.store-info {
  margin-top: auto;
}

.v-card-text {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Responsividade */
@media (max-width: 600px) {
  .product-image {
    height: 160px;
  }
  
  .v-card-text {
    padding: 12px !important;
  }
  
  .v-card-actions {
    padding: 12px !important;
    padding-top: 0 !important;
  }
}
</style>

