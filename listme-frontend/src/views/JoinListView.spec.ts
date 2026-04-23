import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList } from '../types'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { token: 'abc123' } }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

const { mockPreviewToken, mockJoinToken, mockFetchAll } = vi.hoisted(() => ({
  mockPreviewToken: vi.fn(),
  mockJoinToken: vi.fn(),
  mockFetchAll: vi.fn(),
}))

vi.mock('../services/share', () => ({
  shareService: {
    previewToken: mockPreviewToken,
    joinViaToken: mockJoinToken,
  },
}))

vi.mock('../stores/lists', () => ({
  useListsStore: () => ({ fetchAll: mockFetchAll }),
}))

vi.mock('../services/userId', () => ({
  getUserId: vi.fn().mockReturnValue('test-user-id'),
}))

import JoinListView from './JoinListView.vue'

const list: ShoppingList = { id: 'l1', name: 'Feinkost', emoji: '🧀', shareToken: 'abc123', itemCount: 3, checkedCount: 0, participantCount: 2, createdAt: '', updatedAt: '' }

describe('JoinListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchAll.mockResolvedValue([])
  })

  it('shows loading spinner initially', () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    // loading = true before promise resolves
    expect(w.find('.skeleton').exists()).toBe(true)
  })

  it('shows list preview after successful load', async () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    await flushPromises()
    expect(w.text()).toContain('Feinkost')
    expect(w.text()).toContain('🧀')
  })

  it('shows item count in preview', async () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    await flushPromises()
    expect(w.text()).toContain('3')
  })

  it('shows participant count in preview', async () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    await flushPromises()
    expect(w.text()).toContain('2')
  })

  it('shows join button', async () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('beitreten'))
    expect(btn).toBeDefined()
  })

  it('shows not-found state when previewToken throws', async () => {
    mockPreviewToken.mockRejectedValue(new Error('404'))
    const w = mount(JoinListView)
    await flushPromises()
    expect(w.text()).toContain('Link ungültig')
  })

  it('navigates to list-detail after successful join', async () => {
    mockPreviewToken.mockResolvedValue(list)
    mockJoinToken.mockResolvedValue({ ...list, id: 'joined-l1' })
    const w = mount(JoinListView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('beitreten'))!
    await btn.trigger('click')
    await flushPromises()
    // replace (not push) so pressing back skips the invite page
    expect(mockReplace).toHaveBeenCalledWith({ name: 'list-detail', params: { id: 'joined-l1' } })
  })

  it('shows cancel button that navigates home', async () => {
    mockPreviewToken.mockResolvedValue(list)
    const w = mount(JoinListView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('Abbrechen'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'home', params: { userId: 'test-user-id' } })
  })

  it('shows not-found after join failure', async () => {
    mockPreviewToken.mockResolvedValue(list)
    mockJoinToken.mockRejectedValue(new Error('403'))
    const w = mount(JoinListView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('beitreten'))!
    await btn.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Link ungültig')
  })
})
