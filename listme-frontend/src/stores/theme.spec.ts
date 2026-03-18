import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from './theme'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
  })

  it('defaults to dark theme when nothing in storage', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
  })

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('listme-theme', 'light')
    setActivePinia(createPinia())
    const store = useThemeStore()
    expect(store.theme).toBe('light')
  })

  it('toggle switches dark → light', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
    store.toggle()
    expect(store.theme).toBe('light')
  })

  it('toggle switches light → dark', () => {
    localStorage.setItem('listme-theme', 'light')
    setActivePinia(createPinia())
    const store = useThemeStore()
    store.toggle()
    expect(store.theme).toBe('dark')
  })

  it('toggle persists value to localStorage', async () => {
    const store = useThemeStore()
    store.toggle()
    // watcher is async via Vue's reactivity — flush microtasks
    await Promise.resolve()
    expect(localStorage.getItem('listme-theme')).toBe('light')
  })

  it('init does not throw', () => {
    const store = useThemeStore()
    expect(() => store.init()).not.toThrow()
  })

  it('init applies dark theme (removes data-theme attribute)', () => {
    const store = useThemeStore()
    document.documentElement.setAttribute('data-theme', 'latte')
    store.init()
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('init applies light theme (sets data-theme=latte)', () => {
    localStorage.setItem('listme-theme', 'light')
    setActivePinia(createPinia())
    const store = useThemeStore()
    store.init()
    expect(document.documentElement.getAttribute('data-theme')).toBe('latte')
  })
})
