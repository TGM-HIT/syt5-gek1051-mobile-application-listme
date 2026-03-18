import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { Item } from '../types'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockBack = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'l1' } }),
  useRouter: () => ({ back: mockBack }),
}))

const { mockGetTrash, mockRestore, mockPermDelete } = vi.hoisted(() => ({
  mockGetTrash: vi.fn(),
  mockRestore: vi.fn(),
  mockPermDelete: vi.fn(),
}))

vi.mock('../services/item', () => ({
  itemService: {
    getTrash: mockGetTrash,
    restore: mockRestore,
    permanentDelete: mockPermDelete,
  },
}))

const mockGetById = vi.fn()
const mockFetchAll = vi.fn()
vi.mock('../stores/lists', () => ({
  useListsStore: () => ({
    getById: mockGetById,
    fetchAll: mockFetchAll,
  }),
}))

import TrashView from './TrashView.vue'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'i1', listId: 'l1', name: 'Äpfel', checked: false, position: 0,
    categoryId: null, categoryName: null, categoryColor: null,
    quantity: null, quantityUnit: null, price: null, imageUrl: null,
    labels: [], createdAt: '', updatedAt: '',
    deletedAt: new Date().toISOString(), createdByDeviceId: null,
    ...overrides,
  }
}

describe('TrashView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetById.mockReturnValue({ id: 'l1', name: 'Meine Liste', emoji: '🛒' })
    mockFetchAll.mockResolvedValue([])
    mockRestore.mockResolvedValue(makeItem())
    mockPermDelete.mockResolvedValue(undefined)
  })

  it('shows loading state initially', () => {
    mockGetTrash.mockResolvedValue([])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    expect(w.find('.skeleton').exists()).toBe(true)
  })

  it('shows empty trash message when no items', async () => {
    mockGetTrash.mockResolvedValue([])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Papierkorb ist leer')
  })

  it('renders trashed item names', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ name: 'Bananen' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Bananen')
  })

  it('renders multiple trashed items', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ name: 'Äpfel' }), makeItem({ id: 'i2', name: 'Birnen' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Äpfel')
    expect(w.text()).toContain('Birnen')
  })

  it('shows list name in header', async () => {
    mockGetTrash.mockResolvedValue([])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Meine Liste')
  })

  it('calls getTrash with listId on mount', async () => {
    mockGetTrash.mockResolvedValue([])
    mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(mockGetTrash).toHaveBeenCalledWith('l1')
  })

  it('restores item when restore button is clicked', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ id: 'i1', name: 'Äpfel' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    await w.find('button[aria-label="Wiederherstellen"]').trigger('click')
    await flushPromises()
    expect(mockRestore).toHaveBeenCalledWith('l1', 'i1')
  })

  it('removes restored item from list', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ id: 'i1', name: 'Äpfel' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    await w.find('button[aria-label="Wiederherstellen"]').trigger('click')
    await flushPromises()
    expect(w.text()).not.toContain('Äpfel')
  })

  it('permanently deletes item when delete button is clicked', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ id: 'i1', name: 'Äpfel' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    await w.find('button[aria-label="Endgültig löschen"]').trigger('click')
    await flushPromises()
    expect(mockPermDelete).toHaveBeenCalledWith('l1', 'i1')
  })

  it('shows "Alle löschen" when trash is not empty', async () => {
    mockGetTrash.mockResolvedValue([makeItem()])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    expect(w.text()).toContain('Alle löschen')
  })

  it('shows thumbnail image when item has imageUrl', async () => {
    mockGetTrash.mockResolvedValue([makeItem({ imageUrl: 'https://example.com/a.jpg' })])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    const img = w.find('img[src="https://example.com/a.jpg"]')
    expect(img.exists()).toBe(true)
  })

  it('shows back button that navigates back', async () => {
    mockGetTrash.mockResolvedValue([])
    const w = mount(TrashView, { global: { stubs: { Transition: true } } })
    await flushPromises()
    const btn = w.find('button[aria-label="Zurück"]')
    await btn.trigger('click')
    expect(mockBack).toHaveBeenCalled()
  })
})
