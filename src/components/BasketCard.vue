<template>
  <v-card
    class="basket-card"
    elevation="2"
    @click="$emit('click', basket)"
  >
    <!-- Imagem da cesta -->
    <div class="basket-image-container">
      <v-img
        :src="basketImage"
        :alt="'Cesta ' + basket.descricao"
        height="200"
        cover
        class="basket-image"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-icon size="64" color="grey-lighten-2">
              mdi-basket-outline
            </v-icon>
          </div>
        </template>
      </v-img>

      <!-- Badge de quantidade -->
      <v-chip
        v-if="basket.quantidade <= 5"
        :color="basket.quantidade === 0 ? 'error' : 'warning'"
        size="small"
        class="quantity-badge"
      >
        {{ basket.quantidade === 0 ? 'Esgotado' : `${basket.quantidade} disponíveis` }}
      </v-chip>
    </div>

    <!-- Conteúdo do card -->
    <v-card-text class="pa-4">
      <h3 class="text-h6 font-weight-bold mb-2">
        Cesta Semanal
      </h3>

      <p class="text-body-2 text-grey-darken-1 mb-3">
        {{ truncatedDescription }}
      </p>

      <!-- Preço -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="price-container">
          <span class="text-h6 font-weight-bold text-primary">
            R$ {{ formatPrice(basket.valor) }}
          </span>
          <span class="text-caption text-grey-darken-1 ml-1">
            / cesta
          </span>
        </div>

        <v-chip
          :color="basket.quantidade > 0 ? 'success' : 'error'"
          size="small"
          variant="tonal"
        >
          {{ basket.quantidade > 0 ? 'Disponível' : 'Indisponível' }}
        </v-chip>
      </div>

      <!-- Informações da loja -->
      <div v-if="basket.loja?.data" class="store-info">
        <v-divider class="mb-2"></v-divider>
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-1" color="grey-darken-1">
            mdi-store
          </v-icon>
          <span class="text-caption text-grey-darken-1">
            {{ basket.loja.data.attributes.nome }}
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
        :disabled="basket.quantidade === 0"
        @click.stop="$emit('edit', basket)"
      >
        <v-icon class="mr-2">mdi-pencil</v-icon>
        Editar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'BasketCard',
  props: {
    basket: {
      type: Object,
      required: true
    }
  },
  emits: ['click', 'edit'],
  setup(props) {
    const basketImage = computed(() => {
      const images = props.basket?.imagem?.data
      if (images && images.length > 0) {
        const image = images[0]
        // Se for URL completa, usar diretamente
        if (image.attributes.url.startsWith('http')) {
          return image.attributes.url
        }
        // Se for path relativo, construir URL completa
        const baseUrl = process.env.VUE_APP_STRAPI_URL || 'http://localhost:1337'
        return `${baseUrl}${image.attributes.url}`
      }
      // Imagem placeholder
      return '/placeholder-basket.jpg'
    })

    const truncatedDescription = computed(() => {
      const desc = props.basket.descricao
      if (!desc) return 'Cesta com produtos frescos e selecionados'
      return desc.length > 120 ? `${desc.substring(0, 120)}...` : desc
    })

    const formatPrice = (price) => {
      if (!price) return '0,00'
      return price.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    return {
      basketImage,
      truncatedDescription,
      formatPrice
    }
  }
}
</script>

<style scoped>
.basket-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.basket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.basket-image-container {
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
  .basket-image {
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

