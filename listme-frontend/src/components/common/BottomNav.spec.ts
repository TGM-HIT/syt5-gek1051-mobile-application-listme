import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const mockPush = vi.fn()
const mockRouteName = ref<string | null>('home')

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ name: mockRouteName.value }),
}))

import BottomNav from './BottomNav.vue'

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteName.value = 'home'
  })

  it('renders all 3 tabs', () => {
    const w = mount(BottomNav)
    const buttons = w.findAll('button')
    expect(buttons.length).toBe(3)
  })

  it('renders "Listen" tab label', () => {
    const w = mount(BottomNav)
    expect(w.text()).toContain('Listen')
  })

  it('renders "Bibliothek" tab label', () => {
    const w = mount(BottomNav)
    expect(w.text()).toContain('Bibliothek')
  })

  it('renders "Einstellungen" tab label', () => {
    const w = mount(BottomNav)
    expect(w.text()).toContain('Einstellungen')
  })

  it('navigates to / when Lists tab is clicked', async () => {
    const w = mount(BottomNav)
    const btn = w.findAll('button').find(b => b.text().includes('Listen'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('navigates to /library when Bibliothek tab is clicked', async () => {
    const w = mount(BottomNav)
    const btn = w.findAll('button').find(b => b.text().includes('Bibliothek'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('navigates to /settings when Einstellungen tab is clicked', async () => {
    const w = mount(BottomNav)
    const btn = w.findAll('button').find(b => b.text().includes('Einstellungen'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/settings')
  })

  it('applies active class to home tab on home route', () => {
    mockRouteName.value = 'home'
    const w = mount(BottomNav)
    const listenBtn = w.findAll('button').find(b => b.text().includes('Listen'))!
    expect(listenBtn.classes()).toContain('text-ctp-teal')
  })

  it('applies active class to library tab on library route', () => {
    mockRouteName.value = 'library'
    const w = mount(BottomNav)
    const libBtn = w.findAll('button').find(b => b.text().includes('Bibliothek'))!
    expect(libBtn.classes()).toContain('text-ctp-teal')
  })
})
