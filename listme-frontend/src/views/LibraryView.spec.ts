import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { Preset } from '../services/preset'
import type { HistorySuggestion } from '../services/itemHistory'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const { mockPresetGetAll, mockPresetDelete, mockLoadHistory } = vi.hoisted(() => ({
  mockPresetGetAll: vi.fn(),
  mockPresetDelete: vi.fn(),
  mockLoadHistory: vi.fn(),
}))

vi.mock('../services/preset', () => ({
  presetService: { getAll: mockPresetGetAll, delete: mockPresetDelete },
}))

vi.mock('../services/itemHistory', () => ({
  loadHistory: mockLoadHistory,
}))

import LibraryView from './LibraryView.vue'

function makePreset(overrides: Partial<Preset> = {}): Preset {
  return { id: 'p1', name: 'Wochenmarkt', emoji: '🥦', itemCount: 5, createdAt: '', ...overrides }
}

function makeHistory(overrides: Partial<HistorySuggestion> = {}): HistorySuggestion {
  return { name: 'Äpfel', quantityUnit: 'kg', price: null, imageUrl: null, useCount: 3, ...overrides }
}

describe('LibraryView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockPresetGetAll.mockResolvedValue([])
    mockLoadHistory.mockResolvedValue([])
    mockPresetDelete.mockResolvedValue(undefined)
  })

  it('renders the library heading', async () => {
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Bibliothek')
  })

  it('renders search input', async () => {
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.find('input[type="search"], input[type="text"]').exists()).toBe(true)
  })

  it('shows history section heading', async () => {
    mockLoadHistory.mockResolvedValue([makeHistory()])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Meine Artikel')
  })

  it('renders history item names', async () => {
    mockLoadHistory.mockResolvedValue([makeHistory({ name: 'Bananen' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Bananen')
  })

  it('shows history item quantity unit when set', async () => {
    mockLoadHistory.mockResolvedValue([makeHistory({ name: 'Karotten', quantityUnit: 'kg' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('kg')
  })

  it('shows presets section heading', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset()])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Vorlagen')
  })

  it('renders preset names', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset({ name: 'Partyeinkauf' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Partyeinkauf')
  })

  it('renders preset emoji', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset({ emoji: '🎉' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('🎉')
  })

  it('renders preset item count', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset({ itemCount: 8 })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('8')
  })

  it('navigates home with presetId when "Verwenden" is clicked', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset({ id: 'p42', name: 'Wochenmarkt' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('Verwenden'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ name: 'home', query: expect.objectContaining({ presetId: 'p42' }) }))
  })

  it('filters presets by search query', async () => {
    mockPresetGetAll.mockResolvedValue([
      makePreset({ id: 'p1', name: 'Wochenmarkt' }),
      makePreset({ id: 'p2', name: 'Partyeinkauf' }),
    ])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    const input = w.find('input')
    await input.setValue('Woche')
    expect(w.text()).toContain('Wochenmarkt')
    expect(w.text()).not.toContain('Partyeinkauf')
  })

  it('filters history by search query', async () => {
    mockLoadHistory.mockResolvedValue([makeHistory({ name: 'Äpfel' }), makeHistory({ name: 'Bananen' })])
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    const input = w.find('input')
    await input.setValue('Äpf')
    expect(w.text()).toContain('Äpfel')
    expect(w.text()).not.toContain('Bananen')
  })

  it('handles empty state gracefully when presets API fails', async () => {
    mockPresetGetAll.mockRejectedValue(new Error('fail'))
    const w = mount(LibraryView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    // Should not throw; presets should be empty
    expect(w.text()).not.toContain('Partyeinkauf')
  })

  it('shows delete confirmation and deletes preset on confirm', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset({ id: 'p1', name: 'Wochenmarkt' })])
    const w = mount(LibraryView, { global: { stubs: { Teleport: true, Transition: true } } })
    await flushPromises()
    // Click trash button to open confirmation dialog
    const deleteBtn = w.find('button[aria-label="Vorlage löschen"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    // Confirm by clicking the "Löschen" confirm button
    const confirmBtn = w.findAll('button').find(b => b.text() === 'Löschen')!
    await confirmBtn.trigger('click')
    await flushPromises()
    expect(mockPresetDelete).toHaveBeenCalledWith('p1')
  })
})
