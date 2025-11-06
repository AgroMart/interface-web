<template>
  <DefaultLayout>
    <div class="store-page">
      <!-- Cabeçalho da página -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">
            Minha Loja
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Configure as informações da sua loja
          </p>
        </div>
        
        <v-btn
          color="primary"
          size="large"
          :loading="saving"
          @click="saveStore"
        >
          <v-icon class="mr-2">mdi-content-save</v-icon>
          Salvar
        </v-btn>
      </div>

      <!-- Formulário da loja -->
      <v-form ref="form" v-model="valid">
        <v-row>
          <!-- Informações básicas -->
          <v-col cols="12" md="8">
            <v-card class="mb-4" elevation="2">
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">mdi-store</v-icon>
                Informações Básicas
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="storeData.nome"
                      label="Nome da loja *"
                      :rules="nameRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="storeData.descricao"
                      label="Descrição da loja"
                      placeholder="Conte sobre sua loja, seus produtos e métodos de cultivo"
                      variant="outlined"
                      density="comfortable"
                      rows="4"
                      counter="500"
                      :rules="descriptionRules"
                    ></v-textarea>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="storeData.contato"
                      label="Telefone de contato *"
                      :rules="phoneRules"
                      variant="outlined"
                      density="comfortable"
                      mask="(##) #####-####"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="storeData.cnpj"
                      label="CNPJ (opcional)"
                      variant="outlined"
                      density="comfortable"
                      mask="##.###.###/####-##"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-select
                      v-model="storeData.tipos_de_entrega"
                      :items="deliveryOptions"
                      label="Tipo de entrega *"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Endereço -->
            <v-card class="mb-4" elevation="2">
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">mdi-map-marker</v-icon>
                Endereço
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="addressData.cep"
                      label="CEP"
                      variant="outlined"
                      density="comfortable"
                      mask="#####-###"
                      @blur="fetchAddressByCep"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="addressData.rua"
                      label="Rua/Avenida"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="addressData.numero"
                      label="Número"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="5">
                    <v-text-field
                      v-model="addressData.bairro"
                      label="Bairro"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="addressData.cidade"
                      label="Cidade"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="addressData.estado"
                      label="Estado"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="9">
                    <v-text-field
                      v-model="addressData.complemento"
                      label="Complemento"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Banner da loja -->
          <v-col cols="12" md="4">
            <v-card class="mb-4" elevation="2">
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">mdi-image</v-icon>
                Banner da Loja
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-file-input
                  v-model="bannerFile"
                  label="Escolher banner"
                  accept="image/*"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-camera"
                  @change="handleBannerChange"
                ></v-file-input>
                
                <!-- Preview do banner -->
                <div v-if="bannerPreview" class="mt-4">
                  <v-img
                    :src="bannerPreview"
                    height="200"
                    class="rounded"
                    cover
                  ></v-img>
                </div>

                <v-alert
                  type="info"
                  variant="tonal"
                  class="mt-4"
                >
                  <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
                  <strong>Dica:</strong> Use uma imagem que represente bem sua loja. 
                  Recomendamos 800x400 pixels.
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Estatísticas -->
            <v-card elevation="2">
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Estatísticas
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div class="text-center mb-3">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ productStore.products.length }}
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Produtos cadastrados
                  </div>
                </div>

                <div class="text-center mb-3">
                  <div class="text-h4 font-weight-bold text-orange">
                    {{ basketStore.baskets.length }}
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Cestas disponíveis
                  </div>
                </div>

                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-success">
                    0
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Pedidos este mês
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useStoreStore } from '../store/stores'
import { useProductStore } from '../store/products'
import { useBasketStore } from '../store/baskets'
import { useAppStore } from '../store/app'

export default {
  name: 'StorePage',
  components: {
    DefaultLayout
  },
  setup() {
    const storeStore = useStoreStore()
    const productStore = useProductStore()
    const basketStore = useBasketStore()
    const appStore = useAppStore()
    
    // Estado local
    const form = ref(null)
    const valid = ref(false)
    const saving = ref(false)
    const bannerFile = ref(null)
    const bannerPreview = ref(null)

    // Dados da loja
    const storeData = ref({
      nome: '',
      descricao: '',
      contato: '',
      cnpj: '',
      tipos_de_entrega: ''
    })

    // Dados do endereço
    const addressData = ref({
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: ''
    })

    // Opções
    const deliveryOptions = [
      { title: 'Entregar no local', value: 'Entregar' },
      { title: 'Cliente retira', value: 'Receber' }
    ]

    // Regras de validação
    const nameRules = [
      v => !!v || 'Nome da loja é obrigatório',
      v => (v && v.length >= 2) || 'Nome deve ter pelo menos 2 caracteres'
    ]

    const descriptionRules = [
      v => !v || v.length <= 500 || 'Descrição deve ter no máximo 500 caracteres'
    ]

    const phoneRules = [
      v => !!v || 'Telefone é obrigatório',
      v => (v && v.replace(/\D/g, '').length >= 10) || 'Telefone deve ter pelo menos 10 dígitos'
    ]

    // Loja principal
    const mainStore = computed(() => storeStore.mainStore)

    // Carregar dados da loja
    const loadStoreData = () => {
      if (mainStore.value) {
        const attrs = mainStore.value.attributes
        storeData.value = {
          nome: attrs.nome || '',
          descricao: attrs.descricao || '',
          contato: attrs.contato || '',
          cnpj: attrs.cnpj || '',
          tipos_de_entrega: attrs.tipos_de_entrega || ''
        }

        // Carregar endereço
        if (attrs.endereco?.data) {
          const endAttrs = attrs.endereco.data.attributes
          addressData.value = {
            cep: endAttrs.cep || '',
            rua: endAttrs.rua || '',
            numero: endAttrs.numero || '',
            bairro: endAttrs.bairro || '',
            cidade: endAttrs.cidade || '',
            estado: endAttrs.estado || '',
            complemento: endAttrs.complemento || ''
          }
        }

        // Carregar banner
        if (attrs.banner?.data) {
          const banner = attrs.banner.data
          const baseUrl = process.env.VUE_APP_STRAPI_URL || 'http://localhost:1337'
          bannerPreview.value = banner.attributes.url.startsWith('http') 
            ? banner.attributes.url 
            : `${baseUrl}${banner.attributes.url}`
        }
      }
    }

    // Buscar endereço por CEP
    const fetchAddressByCep = async () => {
      const cep = addressData.value.cep?.replace(/\D/g, '')
      if (cep && cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
          const data = await response.json()
          
          if (!data.erro) {
            addressData.value = {
              ...addressData.value,
              rua: data.logradouro || '',
              bairro: data.bairro || '',
              cidade: data.localidade || '',
              estado: data.uf || ''
            }
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error)
        }
      }
    }

    // Manipular mudança de banner
    const handleBannerChange = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          bannerPreview.value = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    // Salvar loja
    const saveStore = async () => {
      if (!valid.value) return

      saving.value = true

      try {
        // Em produção, salvar via API
        console.log('Salvando loja:', {
          store: storeData.value,
          address: addressData.value,
          banner: bannerFile.value
        })

        appStore.showSnackbar('Loja salva com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao salvar loja:', error)
        appStore.showSnackbar('Erro ao salvar loja', 'error')
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      // Carregar dados das stores
      await Promise.all([
        storeStore.fetchStores(),
        productStore.fetchProducts(),
        basketStore.fetchBaskets()
      ])
      
      loadStoreData()
    })

    return {
      form,
      valid,
      saving,
      bannerFile,
      bannerPreview,
      storeData,
      addressData,
      deliveryOptions,
      nameRules,
      descriptionRules,
      phoneRules,
      productStore,
      basketStore,
      fetchAddressByCep,
      handleBannerChange,
      saveStore
    }
  }
}
</script>

<style scoped>
.store-page {
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

