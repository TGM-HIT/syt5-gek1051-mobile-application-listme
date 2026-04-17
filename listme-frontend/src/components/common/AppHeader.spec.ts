import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('../../stores/profile', () => ({
  useProfileStore: () => ({
    initials: 'AM',
    photoDataUrl: null as string | null,
  }),
}))

import AppHeader from './AppHeader.vue'

const mountOpts = {
  global: {
    stubs: {
      // Prevent happy-dom from trying to resolve /icon.svg as a file:// URL
      img: { template: '<img class="stub-img" />' },
    },
  },
}

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the app title', () => {
    const w = mount(AppHeader, mountOpts)
    expect(w.text()).toContain('ListMe')
  })

  it('renders an img element for the logo', () => {
    const w = mount(AppHeader, mountOpts)
    expect(w.find('img').exists()).toBe(true)
  })

  it('renders initials when no photo', () => {
    const w = mount(AppHeader, mountOpts)
    expect(w.text()).toContain('AM')
  })

  it('navigates to settings on avatar click', async () => {
    const w = mount(AppHeader, mountOpts)
    await w.find('button[aria-label="Profil & Einstellungen"]').trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/settings')
  })
})
