import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockRouterBack, mockRouterPush, mockRouteId, mockListsStore, mockItemsStore, mockPresenceStore, mockCategoriesStore, mockListSync, mockExport, mockPreset } = vi.hoisted(() => ({
  mockRouterBack: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouteId: { value: 'list-abc' },
  mockListsStore: {
    getById: vi.fn(),
    fetchAll: vi.fn(),
    lists: [] as { id: string; shareToken: string | null }[],
  },
  mockItemsStore: {
    getItems: vi.fn(() => []),
    fetchAll: vi.fn(),
    toggleCheck: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    loading: false,
    error: null as string | null,
  },
  mockPresenceStore: { getCount: vi.fn(() => 1) },
  mockCategoriesStore: { getForList: vi.fn(() => []), fetchForList: vi.fn(), remove: vi.fn() },
  mockListSync: {
    connected: { value: true },
    conflicts: { value: [] },
    dismissConflicts: vi.fn(),
    startSync: vi.fn(),
  },
  mockExport: { download: vi.fn() },
  mockPreset: { create: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: mockRouteId.value } }),
  useRouter: () => ({ back: mockRouterBack, push: mockRouterPush }),
}))
vi.mock('../stores/lists', () => ({ useListsStore: () => mockListsStore }))
vi.mock('../stores/items', () => ({ useItemsStore: () => mockItemsStore }))
vi.mock('../stores/presence', () => ({ usePresenceStore: () => mockPresenceStore }))
vi.mock('../stores/categories', () => ({ useCategoriesStore: () => mockCategoriesStore }))
vi.mock('../composables/useListSync', () => ({
  useListSync: () => mockListSync,
}))
vi.mock('../services/export', () => ({ exportService: mockExport }))
vi.mock('../services/preset', () => ({ presetService: mockPreset }))
vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn() } }))

// ── Component import ─────────────────────────────────────────────────────────
import ListDetailView from './ListDetailView.vue'

const LIST = {
  id: 'list-abc',
  name: 'Einkauf',
  emoji: '🛒',
  itemCount: 3,
  checkedCount: 1,
  shareToken: null as string | null,
  participantCount: 1,
  createdAt: '',
  updatedAt: '',
}

const BASE_ITEM = { listId: 'list-abc', categoryId: null, categoryName: null, categoryColor: null, labels: [], createdAt: '', updatedAt: '', imageUrl: null, position: 0, price: null, quantity: null, quantityUnit: null, deletedAt: null, createdByDeviceId: 'dev-1' }
const ITEMS = [
  { id: 'i1', name: 'Milk',  checked: false, ...BASE_ITEM },
  { id: 'i2', name: 'Bread', checked: true,  ...BASE_ITEM },
]

function mountView() {
  return mount(ListDetailView, {
    global: {
      stubs: {
        Teleport: true,
        Transition: { template: '<slot />' },
        ItemRow: { template: '<div class="item-row" :data-id="item.id"><span>{{ item.name }}</span></div>', props: ['item'] },
        AddItemSheet: { template: '<div class="add-item-sheet" />', props: ['modelValue', 'editingItem', 'listId'] },
        BudgetBar: { template: '<div class="budget-bar" />', props: ['listId', 'itemsVersion'] },
        ConnectionBanner: { template: '<div class="connection-banner" />', props: ['connected'] },
        ConflictBanner: { template: '<div class="conflict-banner" />', props: ['conflicts'] },
        ParticipantList: { template: '<div class="participant-list" />', props: ['listId'] },
        ParticipantSheet: { template: '<div class="participant-sheet" />', props: ['participant', 'items'] },
        ShareListModal: { template: '<div class="share-list-modal" />', props: ['modelValue', 'list'] },
      },
    },
  })
}

describe('ListDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockItemsStore.loading = false
    mockItemsStore.error = null
    mockItemsStore.getItems.mockReturnValue(ITEMS)
    mockListsStore.getById.mockReturnValue(LIST)
    mockListsStore.lists = [{ id: 'list-abc', shareToken: null }]
  })

  it('fetches lists and items on mount', async () => {
    mountView()
    await vi.dynamicImportSettled()
    expect(mockItemsStore.fetchAll).toHaveBeenCalledWith('list-abc')
    expect(mockListSync.startSync).toHaveBeenCalledWith('list-abc')
  })

  it('shows list name and emoji in header', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.text()).toContain('Einkauf')
    expect(w.text()).toContain('🛒')
  })

  it('shows checkedCount/itemCount', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.text()).toContain('1/3')
  })

  it('renders ItemRow for each item', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.findAll('.item-row')).toHaveLength(2)
  })

  it('back button calls router.back()', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Zurück"]').trigger('click')
    expect(mockRouterBack).toHaveBeenCalled()
  })

  it('search toggle shows search input', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.find('input[type="search"]').exists()).toBe(false)
    await w.find('button[title="Suchen"]').trigger('click')
    expect(w.find('input[type="search"]').exists()).toBe(true)
  })

  it('search toggle hides input and clears query on second click', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[title="Suchen"]').trigger('click')
    await w.find('input[type="search"]').setValue('bread')
    await w.find('button[title="Suchen"]').trigger('click')
    expect(w.find('input[type="search"]').exists()).toBe(false)
  })

  it('search filters items by name', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[title="Suchen"]').trigger('click')
    await w.find('input[type="search"]').setValue('milk')
    const rows = w.findAll('.item-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('Milk')
  })

  it('FAB click opens AddItemSheet', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.find('.add-item-sheet').attributes('modelvalue')).toBeFalsy()
    await w.find('button.fixed.bottom-24').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('.add-item-sheet').exists()).toBe(true)
  })

  it('share button shows ShareListModal', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Liste teilen"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('.share-list-modal').exists()).toBe(true)
  })

  it('export button toggles dropdown', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Liste exportieren"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.text()).toContain('CSV')
    expect(w.text()).toContain('PDF')
  })

  it('CSV export calls exportService.download', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Liste exportieren"]').trigger('click')
    await w.vm.$nextTick()
    const csvBtn = w.findAll('button').find(b => b.text() === 'CSV')
    await csvBtn!.trigger('click')
    expect(mockExport.download).toHaveBeenCalledWith('list-abc', 'csv', 'Einkauf')
  })

  it('shows loading skeletons when itemsStore.loading is true', async () => {
    mockItemsStore.loading = true
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.find('.skeleton').exists()).toBe(true)
  })

  it('shows error message when itemsStore.error is set', async () => {
    mockItemsStore.loading = false
    mockItemsStore.error = 'Network error'
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.text()).toContain('Network error')
  })

  it('shows empty state when no items', async () => {
    mockItemsStore.getItems.mockReturnValue([])
    const w = mountView()
    await vi.dynamicImportSettled()
    expect(w.text()).toContain('Noch keine Items')
  })

  it('trash button navigates to list-trash', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Papierkorb"]').trigger('click')
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'list-trash', params: { id: 'list-abc' } })
  })

  it('save preset button opens preset sheet', async () => {
    const w = mountView()
    await vi.dynamicImportSettled()
    await w.find('button[aria-label="Als Vorlage speichern"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.text()).toContain('Als Vorlage speichern')
  })
})
