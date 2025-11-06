import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './store'
import vuetify from './plugins/vuetify'
import { initOfflineFeatures } from './utils/offline'

// Importar CSS global
import './assets/css/global.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)

// Inicializar funcionalidades offline
initOfflineFeatures()

app.mount('#app')

