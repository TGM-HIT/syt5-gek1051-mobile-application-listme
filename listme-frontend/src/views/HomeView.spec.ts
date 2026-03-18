import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList } from '../types'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockQuery = { value: {} as Record<string, string> }

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mockQuery.value }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

const { mockFetchAll, mockCreate } = vi.hoisted(() => ({
  mockFetchAll: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('../stores/lists', () => ({
  useListsStore: () => ({
    lists: mockListsRef.value,
    fetchAll: mockFetchAll,
    create: mockCreate,
  }),
}))

// Needs to be accessible in mock factory — must be module-level
import { ref } from 'vue'
const mockListsRef = ref<ShoppingList[]>([])

// Stub child components to isolate HomeView logic
vi.mock('../components/list/ListSection.vue', () => ({ default: { template: '<div class="list-section">{{ title }}<slot/></div>', props: ['title', 'count'] } }))
vi.mock('../components/list/ListCard.vue', () => ({ default: { template: '<div class="list-card">{{ list?.name }}</div>', props: ['list', 'index'] } }))
vi.mock('../components/common/FloatingActionButton.vue', () => ({ default: { template: '<button class="fab" @click="$emit(\'click\')">+</button>' } }))
vi.mock('../components/common/AddListModal.vue', () => ({ default: { template: '<div class="add-modal"></div>', props: ['open', 'initialPresetId', 'initialPresetEmoji', 'initialPresetName'] } }))
vi.mock('../components/list/LinkDevicesModal.vue', () => ({ default: { template: '<div class="link-modal"></div>', props: ['open'] } }))

import HomeView from './HomeView.vue'

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'l1', name: 'Wocheneinkauf', emoji: '🛒', shareToken: null,
    itemCount: 4, checkedCount: 2, participantCount: 1, createdAt: '', updatedAt: '',
    ...overrides,
  }
}

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockListsRef.value = []
    mockQuery.value = {}
    mockFetchAll.mockResolvedValue([])
    mockCreate.mockResolvedValue(makeList())
  })

  it('calls fetchAll on mount', async () => {
    mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(mockFetchAll).toHaveBeenCalledOnce()
  })

  it('renders "Deine Listen" heading', async () => {
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('Deine Listen')
  })

  it('shows list count in heading', async () => {
    mockListsRef.value = [makeList(), makeList({ id: 'l2', name: 'Zweite' })]
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('2')
  })

  it('shows totalDone stat', async () => {
    mockListsRef.value = [makeList({ checkedCount: 3 })]
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('3')
  })

  it('shows totalRemaining stat', async () => {
    mockListsRef.value = [makeList({ itemCount: 5, checkedCount: 2 })]
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('3')
  })

  it('shows sharedCount stat for shared lists', async () => {
    mockListsRef.value = [makeList({ participantCount: 3 })]
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('1') // 1 shared list
  })

  it('shows "Meine Listen" section', async () => {
    mockListsRef.value = [makeList()]
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.text()).toContain('Meine Listen')
  })

  it('renders FAB', async () => {
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.find('.fab').exists()).toBe(true)
  })

  it('opens AddListModal when FAB is clicked', async () => {
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    await w.find('.fab').trigger('click')
    expect(w.find('.add-modal').exists()).toBe(true)
  })

  it('opens AddListModal when route has presetId query param', async () => {
    mockQuery.value = { presetId: 'p1', presetEmoji: '🥦', presetName: 'Test' }
    const w = mount(HomeView, { global: { stubs: { Transition: true, Teleport: true } } })
    await flushPromises()
    expect(w.find('.add-modal').exists()).toBe(true)
    expect(mockReplace).toHaveBeenCalledWith({ name: 'home' })
  })
})
