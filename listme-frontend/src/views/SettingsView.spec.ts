import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const mockThemeStore = {
  theme: 'dark' as 'dark' | 'light',
  toggle: vi.fn(),
}

const mockProfileStore = {
  displayName: 'Alice Müller',
  firstName: 'Alice',
  lastName: 'Müller',
  initials: 'AM',
  photoDataUrl: null as string | null,
  save: vi.fn(),
  savePhoto: vi.fn(),
  removePhoto: vi.fn(),
}

vi.mock('../stores/theme', () => ({
  useThemeStore: () => mockThemeStore,
}))

vi.mock('../stores/profile', () => ({
  useProfileStore: () => mockProfileStore,
}))

import SettingsView from './SettingsView.vue'

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockThemeStore.theme = 'dark'
    mockProfileStore.photoDataUrl = null
    mockProfileStore.firstName = 'Alice'
    mockProfileStore.lastName = 'Müller'
    mockProfileStore.initials = 'AM'
    mockProfileStore.save.mockResolvedValue(undefined)
    mockProfileStore.savePhoto.mockResolvedValue(undefined)
    mockProfileStore.removePhoto.mockResolvedValue(undefined)
  })

  it('renders settings heading', () => {
    const w = mount(SettingsView)
    expect(w.text()).toContain('Einstellungen')
  })

  it('renders profile section', () => {
    const w = mount(SettingsView)
    expect(w.text()).toContain('Profil')
  })

  it('shows initials when no photo', () => {
    const w = mount(SettingsView)
    expect(w.text()).toContain('AM')
  })

  it('shows photo img when photoDataUrl is set', () => {
    mockProfileStore.photoDataUrl = 'data:image/png;base64,abc'
    const w = mount(SettingsView)
    const img = w.find('img[alt=""]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('data:image/png;base64,abc')
  })

  it('shows "Bild entfernen" only when photo is set', () => {
    mockProfileStore.photoDataUrl = 'data:image/png;base64,abc'
    const w = mount(SettingsView)
    expect(w.text()).toContain('Bild entfernen')
  })

  it('hides "Bild entfernen" when no photo', () => {
    mockProfileStore.photoDataUrl = null
    const w = mount(SettingsView)
    expect(w.text()).not.toContain('Bild entfernen')
  })

  it('renders firstName and lastName inputs with correct values', () => {
    const w = mount(SettingsView)
    const inputs = w.findAll('input[type="text"]')
    expect(inputs[0]?.element.value).toBe('Alice')
    expect(inputs[1]?.element.value).toBe('Müller')
  })

  it('renders appearance section with dark mode label', () => {
    mockThemeStore.theme = 'dark'
    const w = mount(SettingsView)
    expect(w.text()).toContain('Dunkel')
  })

  it('renders appearance section with light mode label when light', () => {
    mockThemeStore.theme = 'light'
    const w = mount(SettingsView)
    expect(w.text()).toContain('Hell')
  })

  it('calls profileStore.save when save button is clicked', async () => {
    const w = mount(SettingsView)
    const btn = w.findAll('button').find(b => b.text() === 'Speichern')!
    await btn.trigger('click')
    await flushPromises()
    expect(mockProfileStore.save).toHaveBeenCalledWith('Alice', 'Müller')
  })

  it('calls profileStore.removePhoto when remove button is clicked', async () => {
    mockProfileStore.photoDataUrl = 'data:image/png;base64,abc'
    const w = mount(SettingsView)
    const btn = w.findAll('button').find(b => b.text().includes('entfernen'))!
    await btn.trigger('click')
    expect(mockProfileStore.removePhoto).toHaveBeenCalled()
  })
})
