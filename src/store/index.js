import { createPinia } from 'pinia'

// Store principal
export const pinia = createPinia()

// Stores específicos
export { useProductStore } from './products'
export { useStoreStore } from './stores'
export { useBasketStore } from './baskets'
export { useAppStore } from './app'
export { useAuthStore } from './auth'

