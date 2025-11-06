<template>
  <DefaultLayout>
    <div class="profile-page">
      <!-- Cabeçalho da página -->
      <div class="mb-4">
        <h1 class="text-h5 font-weight-bold mb-1">
          Meu Perfil
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <v-row>
        <!-- Informações do usuário -->
        <v-col cols="12" md="8">
          <v-card class="mb-4" elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-account</v-icon>
              Informações Pessoais
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-form ref="form" v-model="valid">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="userData.nome"
                      label="Nome completo *"
                      :rules="nameRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="userData.email"
                      label="E-mail *"
                      type="email"
                      :rules="emailRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="userData.telefone"
                      label="Telefone *"
                      :rules="phoneRules"
                      variant="outlined"
                      density="comfortable"
                      mask="(##) #####-####"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="userData.cpf"
                      label="CPF"
                      variant="outlined"
                      density="comfortable"
                      mask="###.###.###-##"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="userData.bio"
                      label="Sobre você"
                      placeholder="Conte um pouco sobre você e sua experiência na agricultura"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      counter="300"
                      :rules="bioRules"
                    ></v-textarea>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                size="large"
                :loading="saving"
                :disabled="!valid"
                @click="saveProfile"
              >
                <v-icon class="mr-2">mdi-content-save</v-icon>
                Salvar Perfil
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Configurações -->
          <v-card class="mb-4" elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-cog</v-icon>
              Configurações
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="settings.notifications"
                    label="Receber notificações por e-mail"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="settings.sms"
                    label="Receber SMS sobre pedidos"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="settings.darkMode"
                    label="Modo escuro"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="settings.autoSave"
                    label="Salvar dados automaticamente"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="outlined"
                size="large"
                @click="saveSettings"
              >
                <v-icon class="mr-2">mdi-content-save</v-icon>
                Salvar Configurações
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Alterar senha -->
          <v-card elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-lock</v-icon>
              Alterar Senha
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-form ref="passwordForm" v-model="passwordValid">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="passwordData.current"
                      label="Senha atual *"
                      type="password"
                      :rules="currentPasswordRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.new"
                      label="Nova senha *"
                      type="password"
                      :rules="newPasswordRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.confirm"
                      label="Confirmar nova senha *"
                      type="password"
                      :rules="confirmPasswordRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="outlined"
                size="large"
                :loading="changingPassword"
                :disabled="!passwordValid"
                @click="changePassword"
              >
                <v-icon class="mr-2">mdi-lock-reset</v-icon>
                Alterar Senha
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Sidebar -->
        <v-col cols="12" md="4">
          <!-- Avatar -->
          <v-card class="mb-4 text-center" elevation="2">
            <v-card-text class="pa-6">
              <v-avatar
                size="120"
                color="primary"
                class="mb-4"
              >
                <v-img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  alt="Avatar"
                ></v-img>
                <v-icon v-else size="60" color="white">
                  mdi-account
                </v-icon>
              </v-avatar>

              <h3 class="text-h6 font-weight-bold mb-2">
                {{ userData.nome || 'Seu Nome' }}
              </h3>

              <p class="text-body-2 text-grey-darken-1 mb-4">
                Agricultor • AgroMart
              </p>

              <v-file-input
                v-model="avatarFile"
                label="Alterar foto"
                accept="image/*"
                variant="outlined"
                density="comfortable"
                prepend-icon="mdi-camera"
                @change="handleAvatarChange"
              ></v-file-input>
            </v-card-text>
          </v-card>

          <!-- Estatísticas do perfil -->
          <v-card class="mb-4" elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-chart-box</v-icon>
              Suas Estatísticas
            </v-card-title>
            
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ productStore.products.length }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    Produtos
                  </div>
                </div>
                <v-icon color="success">mdi-package-variant</v-icon>
              </div>

              <div class="d-flex align-center justify-space-between mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ basketStore.baskets.length }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    Cestas
                  </div>
                </div>
                <v-icon color="orange">mdi-basket</v-icon>
              </div>

              <div class="d-flex align-center justify-space-between mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">
                    0
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    Pedidos
                  </div>
                </div>
                <v-icon color="info">mdi-clipboard-list</v-icon>
              </div>

              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ storeStore.stores.length }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    Lojas
                  </div>
                </div>
                <v-icon color="primary">mdi-store</v-icon>
              </div>
            </v-card-text>
          </v-card>

          <!-- Ações rápidas -->
          <v-card elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
              Ações Rápidas
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-btn
                color="error"
                variant="outlined"
                block
                size="large"
                class="mb-3"
                @click="clearAllCache"
              >
                <v-icon class="mr-2">mdi-delete-sweep</v-icon>
                Limpar Cache
              </v-btn>

              <v-btn
                color="warning"
                variant="outlined"
                block
                size="large"
                class="mb-3"
                @click="exportData"
              >
                <v-icon class="mr-2">mdi-download</v-icon>
                Exportar Dados
              </v-btn>

              <v-btn
                color="error"
                variant="outlined"
                block
                size="large"
                @click="logout"
              >
                <v-icon class="mr-2">mdi-logout</v-icon>
                Sair
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useProductStore } from '../store/products'
import { useStoreStore } from '../store/stores'
import { useBasketStore } from '../store/baskets'
import { useAppStore } from '../store/app'
import { useAuthStore } from '../store/auth'

export default {
  name: 'ProfilePage',
  components: {
    DefaultLayout
  },
  setup() {
    const router = useRouter()
    const productStore = useProductStore()
    const storeStore = useStoreStore()
    const basketStore = useBasketStore()
    const appStore = useAppStore()
    const authStore = useAuthStore()
    
    // Estado local
    const form = ref(null)
    const passwordForm = ref(null)
    const valid = ref(false)
    const passwordValid = ref(false)
    const saving = ref(false)
    const changingPassword = ref(false)
    const avatarFile = ref(null)
    const avatarPreview = ref(null)

    // Dados do usuário
    const userData = ref({
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '(61) 99999-9999',
      cpf: '123.456.789-00',
      bio: ''
    })

    // Configurações
    const settings = ref({
      notifications: true,
      sms: false,
      darkMode: false,
      autoSave: true
    })

    // Dados de senha
    const passwordData = ref({
      current: '',
      new: '',
      confirm: ''
    })

    // Regras de validação
    const nameRules = [
      v => !!v || 'Nome é obrigatório',
      v => (v && v.length >= 2) || 'Nome deve ter pelo menos 2 caracteres'
    ]

    const emailRules = [
      v => !!v || 'E-mail é obrigatório',
      v => /.+@.+\..+/.test(v) || 'E-mail deve ser válido'
    ]

    const phoneRules = [
      v => !!v || 'Telefone é obrigatório',
      v => (v && v.replace(/\D/g, '').length >= 10) || 'Telefone deve ter pelo menos 10 dígitos'
    ]

    const bioRules = [
      v => !v || v.length <= 300 || 'Bio deve ter no máximo 300 caracteres'
    ]

    const currentPasswordRules = [
      v => !!v || 'Senha atual é obrigatória'
    ]

    const newPasswordRules = [
      v => !!v || 'Nova senha é obrigatória',
      v => (v && v.length >= 6) || 'Nova senha deve ter pelo menos 6 caracteres'
    ]

    const confirmPasswordRules = [
      v => !!v || 'Confirmação de senha é obrigatória',
      v => v === passwordData.value.new || 'Senhas não coincidem'
    ]

    // Manipular mudança de avatar
    const handleAvatarChange = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          avatarPreview.value = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    // Salvar perfil
    const saveProfile = async () => {
      if (!valid.value) return

      saving.value = true

      try {
        // Em produção, salvar via API
        console.log('Salvando perfil:', userData.value)
        
        appStore.showSnackbar('Perfil salvo com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao salvar perfil:', error)
        appStore.showSnackbar('Erro ao salvar perfil', 'error')
      } finally {
        saving.value = false
      }
    }

    // Salvar configurações
    const saveSettings = () => {
      // Salvar configurações no localStorage
      localStorage.setItem('agromart_settings', JSON.stringify(settings.value))
      appStore.showSnackbar('Configurações salvas!', 'success')
    }

    // Alterar senha
    const changePassword = async () => {
      if (!passwordValid.value) return

      changingPassword.value = true

      try {
        // Em produção, alterar via API
        console.log('Alterando senha')
        
        // Limpar campos
        passwordData.value = {
          current: '',
          new: '',
          confirm: ''
        }
        
        appStore.showSnackbar('Senha alterada com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao alterar senha:', error)
        appStore.showSnackbar('Erro ao alterar senha', 'error')
      } finally {
        changingPassword.value = false
      }
    }

    // Limpar cache
    const clearAllCache = () => {
      productStore.clearCache()
      storeStore.clearCache()
      basketStore.clearCache()
      localStorage.removeItem('agromart_settings')
      appStore.showSnackbar('Cache limpo com sucesso!', 'success')
    }

    // Exportar dados
    const exportData = () => {
      const data = {
        profile: userData.value,
        settings: settings.value,
        products: productStore.products,
        stores: storeStore.stores,
        baskets: basketStore.baskets
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'agromart-dados.json'
      a.click()
      URL.revokeObjectURL(url)
      
      appStore.showSnackbar('Dados exportados com sucesso!', 'success')
    }

    // Logout
    const logout = () => {
      // Em produção, fazer logout via API
      clearAllCache()
      authStore.logout()
      router.push('/login')
      appStore.showSnackbar('Logout realizado com sucesso', 'success')
    }

    onMounted(() => {
      // Carregar configurações salvas
      const savedSettings = localStorage.getItem('agromart_settings')
      if (savedSettings) {
        settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
      }
    })

    return {
      form,
      passwordForm,
      valid,
      passwordValid,
      saving,
      changingPassword,
      avatarFile,
      avatarPreview,
      userData,
      settings,
      passwordData,
      nameRules,
      emailRules,
      phoneRules,
      bioRules,
      currentPasswordRules,
      newPasswordRules,
      confirmPasswordRules,
      productStore,
      storeStore,
      basketStore,
      handleAvatarChange,
      saveProfile,
      saveSettings,
      changePassword,
      clearAllCache,
      exportData,
      logout
    }
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

