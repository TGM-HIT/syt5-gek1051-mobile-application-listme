import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { useThemeStore } from './stores/theme'
import { useProfileStore } from './stores/profile'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

useThemeStore().init()
useProfileStore().init()
