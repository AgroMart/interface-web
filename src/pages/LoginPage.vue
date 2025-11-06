<template>
  <v-app>
    <v-main class="login-page">
      <v-container fluid class="fill-height pa-0">
        <v-row no-gutters class="fill-height">
          <!-- Coluna da esquerda - Branding (oculta em mobile) -->
          <v-col
            cols="12"
            md="6"
            class="branding-section d-none d-md-flex"
          >
            <div class="branding-content">
              <div class="logo-container">
                <v-icon size="80" color="white">mdi-sprout</v-icon>
                <h1 class="app-title">AgroMart</h1>
              </div>
              <p class="app-subtitle">
                Sistema de gestão para Comunidades que Sustentam a Agricultura
              </p>
              <div class="features-list">
                <div class="feature-item">
                  <v-icon color="white" size="24">mdi-check-circle</v-icon>
                  <span>Gerencie seus produtos facilmente</span>
                </div>
                <div class="feature-item">
                  <v-icon color="white" size="24">mdi-check-circle</v-icon>
                  <span>Organize suas cestas semanais</span>
                </div>
                <div class="feature-item">
                  <v-icon color="white" size="24">mdi-check-circle</v-icon>
                  <span>Acompanhe pedidos em tempo real</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Coluna da direita - Formulário de Login -->
          <v-col
            cols="12"
            md="6"
            class="form-section"
          >
            <div class="form-container">
              <!-- Logo mobile -->
              <div class="mobile-logo d-md-none">
                <v-icon size="60" color="success">mdi-sprout</v-icon>
                <h2 class="mobile-title">AgroMart</h2>
              </div>

              <!-- Título -->
              <div class="form-header">
                <h2 class="form-title">{{ isLogin ? 'Entrar' : 'Criar Conta' }}</h2>
                <p class="form-subtitle">
                  {{ isLogin ? 'Acesse sua conta para continuar' : 'Cadastre-se para começar' }}
                </p>
              </div>

              <!-- Mensagens de erro -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                closable
                @click:close="clearError"
                class="mb-4"
              >
                {{ error }}
              </v-alert>

              <!-- Mensagem de sucesso -->
              <v-alert
                v-if="successMessage"
                type="success"
                variant="tonal"
                closable
                @click:close="successMessage = ''"
                class="mb-4"
              >
                {{ successMessage }}
              </v-alert>

              <!-- Formulário -->
              <v-form ref="form" @submit.prevent="handleSubmit">
                <!-- Campo Username (apenas no registro) -->
                <v-text-field
                  v-if="!isLogin"
                  v-model="formData.username"
                  label="Nome de usuário"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="mb-2"
                  density="comfortable"
                  hide-details="auto"
                />

                <!-- Campo Email -->
                <v-text-field
                  v-model="formData.email"
                  :label="isLogin ? 'Email ou usuário' : 'Email'"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  :rules="isLogin ? [rules.required] : [rules.required, rules.email]"
                  class="mb-2"
                  density="comfortable"
                  hide-details="auto"
                  autocomplete="email"
                />

                <!-- Campo Senha -->
                <v-text-field
                  v-model="formData.password"
                  label="Senha"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="[rules.required, rules.minLength]"
                  class="mb-2"
                  density="comfortable"
                  hide-details="auto"
                  autocomplete="current-password"
                  @click:append-inner="showPassword = !showPassword"
                />

                <!-- Campo Confirmar Senha (apenas no registro) -->
                <v-text-field
                  v-if="!isLogin"
                  v-model="formData.passwordConfirm"
                  label="Confirmar senha"
                  prepend-inner-icon="mdi-lock-check"
                  :append-inner-icon="showPasswordConfirm ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPasswordConfirm ? 'text' : 'password'"
                  variant="outlined"
                  :rules="[rules.required, rules.passwordMatch]"
                  class="mb-2"
                  density="comfortable"
                  hide-details="auto"
                  autocomplete="new-password"
                  @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
                />

                <!-- Link Esqueci a senha -->
                <div v-if="isLogin" class="text-right mb-4">
                  <a
                    href="#"
                    class="forgot-password-link"
                    @click.prevent="showForgotPassword = true"
                  >
                    Esqueci minha senha
                  </a>
                </div>

                <!-- Botão Submit -->
                <v-btn
                  type="submit"
                  color="success"
                  size="large"
                  block
                  :loading="loading"
                  class="mb-4 text-none"
                  elevation="0"
                >
                  <v-icon left class="mr-2">
                    {{ isLogin ? 'mdi-login' : 'mdi-account-plus' }}
                  </v-icon>
                  {{ isLogin ? 'Entrar' : 'Criar Conta' }}
                </v-btn>

                <!-- Toggle entre Login e Registro -->
                <div class="text-center">
                  <span class="toggle-text">
                    {{ isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
                  </span>
                  <a
                    href="#"
                    class="toggle-link"
                    @click.prevent="toggleMode"
                  >
                    {{ isLogin ? 'Criar conta' : 'Fazer login' }}
                  </a>
                </div>
              </v-form>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Dialog Recuperar Senha -->
      <v-dialog
        v-model="showForgotPassword"
        max-width="500"
        persistent
      >
        <v-card>
          <v-card-title class="text-h5 pa-4">
            Recuperar Senha
          </v-card-title>
          <v-card-text class="pa-4">
            <p class="mb-4">
              Digite seu email para receber as instruções de recuperação de senha.
            </p>
            <v-text-field
              v-model="forgotPasswordEmail"
              label="Email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              :rules="[rules.required, rules.email]"
              density="comfortable"
            />
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              color="grey"
              variant="text"
              @click="showForgotPassword = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="success"
              variant="flat"
              :loading="loading"
              @click="handleForgotPassword"
            >
              Enviar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// Estado do formulário
const isLogin = ref(true)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const successMessage = ref('')

const formData = ref({
  username: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const form = ref(null)

// Computed
const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)

// Regras de validação
const rules = {
  required: (value) => !!value || 'Campo obrigatório',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
  minLength: (value) => {
    return value.length >= 6 || 'Mínimo de 6 caracteres'
  },
  passwordMatch: (value) => {
    return value === formData.value.password || 'As senhas não coincidem'
  }
}

// Métodos
const toggleMode = () => {
  isLogin.value = !isLogin.value
  clearForm()
  clearError()
}

const clearForm = () => {
  formData.value = {
    username: '',
    email: '',
    password: '',
    passwordConfirm: ''
  }
  if (form.value) {
    form.value.resetValidation()
  }
}

const clearError = () => {
  authStore.clearError()
}

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  
  if (!valid) return

  if (isLogin.value) {
    await handleLogin()
  } else {
    await handleRegister()
  }
}

const handleLogin = async () => {
  const result = await authStore.login({
    identifier: formData.value.email,
    password: formData.value.password
  })

  if (result.success) {
    router.push('/')
  }
}

const handleRegister = async () => {
  const result = await authStore.register({
    username: formData.value.username,
    email: formData.value.email,
    password: formData.value.password
  })

  if (result.success) {
    router.push('/')
  }
}

const handleForgotPassword = async () => {
  if (!forgotPasswordEmail.value) {
    return
  }

  const result = await authStore.forgotPassword(forgotPasswordEmail.value)

  if (result.success) {
    successMessage.value = 'Email enviado! Verifique sua caixa de entrada.'
    showForgotPassword.value = false
    forgotPasswordEmail.value = ''
  }
}
</script>

<style scoped>
.login-page {
  background: #f5f5f5;
}

/* Seção de Branding */
.branding-section {
  background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.branding-content {
  max-width: 500px;
  color: white;
  text-align: center;
}

.logo-container {
  margin-bottom: 2rem;
}

.app-title {
  font-size: 3rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0;
}

.app-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.features-list {
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

/* Seção do Formulário */
.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: white;
}

.form-container {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

.mobile-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.mobile-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2e7d32;
  margin-top: 0.5rem;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: #666;
  font-size: 1rem;
}

.forgot-password-link {
  color: #2e7d32;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.toggle-text {
  color: #666;
  margin-right: 0.5rem;
}

.toggle-link {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 600;
}

.toggle-link:hover {
  text-decoration: underline;
}

/* Responsividade */
@media (max-width: 960px) {
  .form-container {
    padding: 1rem;
  }

  .form-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 600px) {
  .form-section {
    padding: 1rem 0.5rem;
  }

  .mobile-title {
    font-size: 1.75rem;
  }

  .form-title {
    font-size: 1.5rem;
  }
}
</style>
