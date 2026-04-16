import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockIsOnline = ref(true)
const mockRouteMeta = ref({})

vi.mock('vue-router', () => ({
  useRoute: () => ({ meta: mockRouteMeta.value }),
}))

vi.mock('./composables/useOffline', () => ({
  useOffline: () => ({ isOnline: mockIsOnline }),
}))

vi.mock('./composables/useSyncQueue', () => ({
  useSyncQueue: () => ({ flushQueue: vi.fn() }),
}))

vi.mock('./components/common/AppHeader.vue', () => ({ default: { template: '<div class="app-header" />' } }))
vi.mock('./components/common/BottomNav.vue', () => ({ default: { template: '<nav class="bottom-nav" />' } }))
vi.mock('./components/common/ConflictToast.vue', () => ({ default: { template: '<div />' } }))

vi.mock('./services/push', () => ({
  pushService: { init: vi.fn().mockResolvedValue(undefined) },
}))

import App from './App.vue'

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsOnline.value = true
    mockRouteMeta.value = {}
  })

  it('renders AppHeader by default', () => {
    const w = mount(App, { global: { stubs: { RouterView: true, Transition: true } } })
    expect(w.find('.app-header').exists()).toBe(true)
  })

  it('renders BottomNav by default', () => {
    const w = mount(App, { global: { stubs: { RouterView: true, Transition: true } } })
    expect(w.find('.bottom-nav').exists()).toBe(true)
  })

  it('hides AppHeader when hideChrome is true', () => {
    mockRouteMeta.value = { hideChrome: true }
    const w = mount(App, { global: { stubs: { RouterView: true, Transition: true } } })
    expect(w.find('.app-header').exists()).toBe(false)
  })

  it('shows offline banner class when offline', async () => {
    mockIsOnline.value = false
    const w = mount(App, { global: { stubs: { RouterView: true, Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Offline')
  })
})
