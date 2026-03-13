import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'listme-theme'
const DARK_THEME_COLOR = '#303446'
const LIGHT_THEME_COLOR = '#eff1f5'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) ?? 'dark')

  function applyTheme(t: Theme) {
    const html = document.documentElement
    if (t === 'light') {
      html.setAttribute('data-theme', 'latte')
    } else {
      html.removeAttribute('data-theme')
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', t === 'light' ? LIGHT_THEME_COLOR : DARK_THEME_COLOR)
    }
  }

  function init() {
    applyTheme(theme.value)
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  watch(theme, (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  })

  return { theme, init, toggle }
})
