import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList } from '../types'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { token: 'sync999' } }),
  useRouter: () => ({ push: mockPush }),
}))

const { mockPreviewSync, mockApplySync, mockFetchAll } = vi.hoisted(() => ({
  mockPreviewSync: vi.fn(),
  mockApplySync: vi.fn(),
  mockFetchAll: vi.fn(),
}))

vi.mock('../services/share', () => ({
  shareService: {
    previewSyncToken: mockPreviewSync,
    applySyncToken: mockApplySync,
  },
}))

vi.mock('../stores/lists', () => ({
  useListsStore: () => ({ fetchAll: mockFetchAll }),
}))

vi.mock('../stores/profile', () => ({
  useProfileStore: () => ({ applyFromSync: vi.fn() }),
}))

vi.mock('../stores/theme', () => ({
  useThemeStore: () => ({ theme: 'dark' }),
}))

vi.mock('../services/userId', () => ({
  getUserId: vi.fn().mockReturnValue('test-user-id'),
}))

import SyncApplyView from './SyncApplyView.vue'

const lists: ShoppingList[] = [
  { id: 'l1', name: 'Wocheneinkauf', emoji: '🛒', shareToken: null, itemCount: 3, checkedCount: 0, participantCount: 1, createdAt: '', updatedAt: '' },
  { id: 'l2', name: 'Büro', emoji: '💼', shareToken: null, itemCount: 5, checkedCount: 2, participantCount: 1, createdAt: '', updatedAt: '' },
]

const previewResponse = { lists, sourceDisplayName: null, sourceProfilePicture: null, theme: 'dark' }
const applyResponse = { lists, displayName: null, profilePicture: null, theme: 'dark', presetsImported: 0 }

describe('SyncApplyView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchAll.mockResolvedValue([])
  })

  it('shows loading skeletons initially', () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    const w = mount(SyncApplyView)
    expect(w.find('.skeleton').exists()).toBe(true)
  })

  it('shows list count after load', async () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('2')
  })

  it('shows list names in preview', async () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('Wocheneinkauf')
    expect(w.text()).toContain('Büro')
  })

  it('shows error state for not_found when previewSync throws non-410', async () => {
    mockPreviewSync.mockRejectedValue({ response: { status: 404 } })
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('Link ungültig')
  })

  it('shows expired state when previewSync throws 410', async () => {
    mockPreviewSync.mockRejectedValue({ response: { status: 410 } })
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('Link abgelaufen')
  })

  it('shows expired emoji for expired error', async () => {
    mockPreviewSync.mockRejectedValue({ response: { status: 410 } })
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('⏳')
  })

  it('shows ❌ emoji for not_found error', async () => {
    mockPreviewSync.mockRejectedValue({ response: { status: 404 } })
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.text()).toContain('❌')
  })

  it('shows import button', async () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    const w = mount(SyncApplyView)
    await flushPromises()
    expect(w.findAll('button').some(b => b.text().includes('importieren'))).toBe(true)
  })

  it('navigates home after successful apply', async () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    mockApplySync.mockResolvedValue(applyResponse)
    const w = mount(SyncApplyView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('importieren'))!
    await btn.trigger('click')
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ name: 'home', params: { userId: 'test-user-id' } })
  })

  it('shows cancel button', async () => {
    mockPreviewSync.mockResolvedValue(previewResponse)
    const w = mount(SyncApplyView)
    await flushPromises()
    const btn = w.findAll('button').find(b => b.text().includes('Abbrechen'))!
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'home', params: { userId: 'test-user-id' } })
  })
})
