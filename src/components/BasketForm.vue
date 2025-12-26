<template>
  <v-card class="basket-form">
    <v-card-title class="text-h6 font-weight-bold">
      {{ isEditing ? 'Editar Cesta' : 'Nova Cesta' }}
    </v-card-title>

    <v-card-text class="pa-6">
      <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
        <v-row>
          <!-- Descrição da cesta -->
          <v-col cols="12">
            <v-textarea
              v-model="formData.descricao"
              label="Descrição da cesta *"
              placeholder="Descreva o que está incluído na cesta: tipos de produtos, quantidade, etc."
              :rules="descriptionRules"
              variant="outlined"
              density="comfortable"
              rows="4"
              counter="500"
              required
            ></v-textarea>
          </v-col>

          <!-- Preço e quantidade -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.valor"
              label="Preço (R$) *"
              type="number"
              step="0.01"
              min="0"
              :rules="priceRules"
              variant="outlined"
              density="comfortable"
              prefix="R$"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.quantidade"
              label="Quantidade disponível *"
              type="number"
              min="0"
              :rules="quantityRules"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>
          </v-col>

          <!-- Upload de imagens -->
          <v-col cols="12">
            <v-file-input
              v-model="imageFiles"
              label="Fotos da cesta"
              accept="image/*"
              multiple
              variant="outlined"
              density="comfortable"
              prepend-icon="mdi-camera"
              @change="handleImageChange"
            ></v-file-input>
            
            <!-- Preview das imagens -->
            <div v-if="imagePreviews.length > 0" class="mt-4">
              <v-row>
                <v-col
                  v-for="(preview, index) in imagePreviews"
                  :key="index"
                  cols="6"
                  sm="4"
                  md="3"
                >
                  <div class="image-preview-container">
                    <v-img
                      :src="preview"
                      height="120"
                      class="rounded"
                      cover
                    ></v-img>
                    <v-btn
                      icon
                      size="small"
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>

          <!-- Dicas para o agricultor -->
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
              <strong>Dica:</strong> Descreva bem o que está incluído na cesta. 
              Exemplo: "2kg de tomates, 1kg de alface, 500g de cenoura, 1 maço de coentro"
            </v-alert>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-6 pt-0">
      <v-spacer></v-spacer>
      
      <v-btn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
      >
        Cancelar
      </v-btn>
      
      <v-btn
        color="primary"
        size="large"
        :loading="loading"
        :disabled="!valid"
        @click="handleSubmit"
      >
        {{ isEditing ? 'Salvar' : 'Criar' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { apiService } from '../services/api'

export default {
  name: 'BasketForm',
  props: {
    basket: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref(null)
    const valid = ref(false)
    const loading = ref(false)
    const imageFiles = ref([])
    const imagePreviews = ref([])

    // Dados do formulário
    const formData = ref({
      descricao: '',
      valor: null,
      quantidade: null
    })

    // Regras de validação
    const descriptionRules = [
      v => !!v || 'Descrição é obrigatória',
      v => (v && v.length >= 10) || 'Descrição deve ter pelo menos 10 caracteres',
      v => (v && v.length <= 500) || 'Descrição deve ter no máximo 500 caracteres'
    ]

    const priceRules = [
      v => !!v || 'Preço é obrigatório',
      v => (v && v > 0) || 'Preço deve ser maior que zero'
    ]

    const quantityRules = [
      v => v !== null && v !== undefined && v !== '' || 'Quantidade é obrigatória',
      v => (v >= 0) || 'Quantidade não pode ser negativa'
    ]

    const isEditing = computed(() => !!props.basket)

    // Carregar dados da cesta para edição
    const loadBasketData = () => {
      if (props.basket) {
        const attrs = props.basket
        formData.value = {
          descricao: attrs.descricao || '',
          valor: attrs.valor || null,
          quantidade: attrs.quantidade || null
        }

        // Carregar imagens existentes
        if (attrs.imagem?.data && attrs.imagem.data.length > 0) {
          const baseUrl = process.env.VUE_APP_STRAPI_URL || 'http://localhost:1337'
          imagePreviews.value = attrs.imagem.data.map(image => 
            image.attributes.url.startsWith('http') 
              ? image.attributes.url 
              : `${baseUrl}${image.attributes.url}`
          )
        }
      } else {
        // Resetar formulário para nova cesta
        formData.value = {
          descricao: '',
          valor: null,
          quantidade: null
        }
        imagePreviews.value = []
        imageFiles.value = []
      }
    }

    // Manipular mudança de imagens
    const handleImageChange = (event) => {
      const files = event.target.files
      if (files && files.length > 0) {
        // Limpar previews anteriores se for upload novo
        if (!isEditing.value) {
          imagePreviews.value = []
        }

        Array.from(files).forEach(file => {
          const reader = new FileReader()
          reader.onload = (e) => {
            imagePreviews.value.push(e.target.result)
          }
          reader.readAsDataURL(file)
        })
      }
    }

    // Remover imagem
    const removeImage = (index) => {
      imagePreviews.value.splice(index, 1)
      if (imageFiles.value && imageFiles.value.length > index) {
        const newFiles = Array.from(imageFiles.value)
        newFiles.splice(index, 1)
        imageFiles.value = newFiles
      }
    }

    // Submeter formulário
    const handleSubmit = async () => {
      if (!valid.value) return

      loading.value = true

      try {
        let basketData = { ...formData.value }

        // Upload das imagens se houver
        if (imageFiles.value && imageFiles.value.length > 0) {
          const uploadPromises = Array.from(imageFiles.value).map(file => 
            apiService.uploadFile(file)
          )
          const uploadResponses = await Promise.all(uploadPromises)
          basketData.imagem = uploadResponses.map(response => response.data[0].id)
        }

        emit('save', basketData)
      } catch (error) {
        console.error('Erro ao salvar cesta:', error)
      } finally {
        loading.value = false
      }
    }

    // Watchers
    watch(() => props.basket, loadBasketData, { immediate: true })

    onMounted(() => {
      loadBasketData()
    })

    return {
      form,
      valid,
      loading,
      imageFiles,
      imagePreviews,
      formData,
      descriptionRules,
      priceRules,
      quantityRules,
      isEditing,
      handleImageChange,
      removeImage,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.basket-form {
  max-width: 100%;
}

.image-preview-container {
  position: relative;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

/* Responsividade */
@media (max-width: 600px) {
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-card-actions {
    padding: 16px !important;
    padding-top: 0 !important;
  }
}
</style>

