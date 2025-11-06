import axios from 'axios'

// URL base da API Strapi - pode ser configurada via variável de ambiente
const API_BASE_URL = process.env.VUE_APP_STRAPI_API_URL || 'http://localhost:1337/api'


// Instância do Axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout para conexões lentas
})

// Adicionar token JWT nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agromart_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Estado global para controle de loading
let loadingCount = 0
const loadingCallbacks = []

// Função para adicionar callback de loading
export const onLoadingChange = (callback) => {
  loadingCallbacks.push(callback)
}

// Função para notificar mudanças no loading
const notifyLoadingChange = (isLoading) => {
  loadingCallbacks.forEach(callback => callback(isLoading))
}

// Interceptor para requisições - ativar loading
api.interceptors.request.use(
  (config) => {
    loadingCount++
    if (loadingCount === 1) {
      notifyLoadingChange(true)
    }
    return config
  },
  (error) => {
    loadingCount--
    if (loadingCount === 0) {
      notifyLoadingChange(false)
    }
    return Promise.reject(error)
  }
)

// Interceptor para respostas - desativar loading e tratar erros
api.interceptors.response.use(
  (response) => {
    loadingCount--
    if (loadingCount === 0) {
      notifyLoadingChange(false)
    }
    return response
  },
  (error) => {
    loadingCount--
    if (loadingCount === 0) {
      notifyLoadingChange(false)
    }
    
    // Tratamento de erros específicos
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout: A conexão demorou muito para responder')
    } else if (!error.response) {
      console.error('Erro de rede: Verifique sua conexão com a internet')
    } else {
      console.error('Erro na API:', error.response.status, error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// Funções para consumir os endpoints da API Strapi
export const apiService = {
  // Produtos Avulsos
  getProducts: (params = {}) => {
    return api.get('/produtos-avulsos', {
      params: {
        populate: ['imagem', 'loja'],
        ...params
      }
    })
  },
  
  getProduct: (id) => {
    return api.get(`/produtos-avulsos/${id}`, {
      params: {
        populate: ['imagem', 'loja']
      }
    })
  },
  
  createProduct: (data) => {
    return api.post('/produtos-avulsos', { data })
  },
  
  updateProduct: (id, data) => {
    return api.put(`/produtos-avulsos/${id}`, { data })
  },
  
  deleteProduct: (id) => {
    return api.delete(`/produtos-avulsos/${id}`)
  },

  // Lojas
  getStores: (params = {}) => {
    return api.get('/lojas', { 
      params: {
        populate: ['banner', 'endereco', 'cestas', 'produto_avulsos'],
        ...params
      }
    })
  },
  
  getStore: (id) => {
    return api.get(`/lojas/${id}`, {
      params: {
        populate: ['banner', 'endereco', 'cestas', 'produto_avulsos', 'planos']
      }
    })
  },
  
  updateStore: (id, data) => {
    return api.put(`/lojas/${id}`, { data })
  },

  // Cestas
  getBaskets: (params = {}) => {
    return api.get('/cestas', { 
      params: {
        populate: ['imagem', 'loja'],
        ...params
      }
    })
  },
  
  getBasket: (id) => {
    return api.get(`/cestas/${id}`, {
      params: {
        populate: ['imagem', 'loja']
      }
    })
  },
  
  createBasket: (data) => {
    return api.post('/cestas', { data })
  },
  
  updateBasket: (id, data) => {
    return api.put(`/cestas/${id}`, { data })
  },
  
  deleteBasket: (id) => {
    return api.delete(`/cestas/${id}`)
  },

  // Planos
  getPlans: (params = {}) => {
    return api.get('/planos', { 
      params: {
        populate: ['imagem', 'lojas', 'assinantes'],
        ...params
      }
    })
  },
  
  getPlan: (id) => {
    return api.get(`/planos/${id}`, {
      params: {
        populate: ['imagem', 'lojas', 'assinantes']
      }
    })
  },

  // Assinantes
  getSubscribers: (params = {}) => {
    return api.get('/assinantes', { 
      params: {
        populate: ['usuario', 'planos', 'lojas'],
        ...params
      }
    })
  },
  
  getSubscriber: (id) => {
    return api.get(`/assinantes/${id}`, {
      params: {
        populate: ['usuario', 'planos', 'lojas']
      }
    })
  },

  // Upload de arquivos
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('files', file)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// Serviços de autenticação
export const authService = {
  // Login
  login: (credentials) => {
    return api.post('/auth/local', {
      identifier: credentials.identifier, // email ou username
      password: credentials.password
    })
  },

  // Registro
  register: (userData) => {
    return api.post('/auth/local/register', {
      username: userData.username,
      email: userData.email,
      password: userData.password
    })
  },

  // Obter dados do usuário atual
  getMe: () => {
    return api.get('/users/me', {
      params: {
        populate: ['role', 'loja']
      }
    })
  },

  // Atualizar dados do usuário
  updateMe: (userData) => {
    const userId = JSON.parse(localStorage.getItem('agromart_user'))?.id
    return api.put(`/users/${userId}`, userData)
  },

  // Recuperar senha
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', {
      email: email
    })
  },

  // Resetar senha
  resetPassword: (data) => {
    return api.post('/auth/reset-password', {
      code: data.code,
      password: data.password,
      passwordConfirmation: data.passwordConfirmation
    })
  },

  // Alterar senha
  changePassword: (currentPassword, newPassword, newPasswordConfirmation) => {
    return api.post('/auth/change-password', {
      currentPassword,
      password: newPassword,
      passwordConfirmation: newPasswordConfirmation
    })
  }
}

export default api

