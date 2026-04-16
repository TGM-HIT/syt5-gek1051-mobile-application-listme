import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { useThemeStore } from './stores/theme'
import { useProfileStore } from './stores/profile'
import { initUserId } from './services/userId'

async function bootstrap() {
  // Ensure userId is in localStorage before the router runs its first guard
  await initUserId()

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.mount('#app')

  useThemeStore().init()
  useProfileStore().init()
}

bootstrap()
