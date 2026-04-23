import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Item } from '../types'

const {
  mockItemService, mockCacheService, mockEnqueue,
  mockGetNextClock, mockGetDeviceId, mockPatchCounts,
} = vi.hoisted(() => ({
  mockItemService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleCheck: vi.fn(),
    delete: vi.fn(),
  },
  mockCacheService: {
    getItems: vi.fn().mockResolvedValue([]),
    saveItems: vi.fn().mockResolvedValue(undefined),
    saveItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
  mockEnqueue: vi.fn().mockResolvedValue(undefined),
  mockGetNextClock: vi.fn().mockResolvedValue({ 'dev-1': 1 }),
  mockGetDeviceId: vi.fn().mockResolvedValue('dev-1'),
  mockPatchCounts: vi.fn(),
}))

vi.mock('../services/item', () => ({ itemService: mockItemService }))
vi.mock('../services/cache', () => ({ CacheService: mockCacheService }))
vi.mock('../crdt/OperationQueue', () => ({ OperationQueue: { enqueue: mockEnqueue } }))
vi.mock('../services/clock', () => ({ LocalClockService: { getNextClock: mockGetNextClock } }))
vi.mock('../services/device', () => ({ getDeviceId: mockGetDeviceId }))
vi.mock('./lists', () => ({ useListsStore: () => ({ patchCounts: mockPatchCounts }) }))

import { useItemsStore } from './items'

function makeItem(id: string, name: string, checked = false, listId = 'list-1'): Item {
  return {
    id, listId, name, checked,
    position: 0, categoryId: null, categoryName: null, categoryColor: null,
    quantity: null, quantityUnit: null, price: null, imageUrl: null,
    labels: [], createdAt: '', updatedAt: '', deletedAt: null, createdByDeviceId: null,
  }
}

// Simulate an Axios network error (no response object)
function networkError(): Error {
  const e: any = new Error('network')
  e.isAxiosError = true
  e.response = undefined
  return e
}

// Simulate a gateway error (e.g. Nginx 502 when backend is down)
function gatewayError(status: 502 | 503 | 504): Error {
  const e: any = new Error(`HTTP ${status}`)
  e.isAxiosError = true
  e.response = { status }
  return e
}

describe('useItemsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockCacheService.getItems.mockResolvedValue([])
    mockCacheService.saveItems.mockResolvedValue(undefined)
    mockCacheService.saveItem.mockResolvedValue(undefined)
    mockCacheService.removeItem.mockResolvedValue(undefined)
  })

  // ── getItems ──────────────────────────────────────────────────────────

  it('getItems returns empty array for unknown list', () => {
    const store = useItemsStore()
    expect(store.getItems('list-1')).toEqual([])
  })

  // ── fetchAll ──────────────────────────────────────────────────────────

  it('fetchAll populates itemsByList', async () => {
    const items = [makeItem('i1', 'Milk')]
    mockItemService.getAll.mockResolvedValue(items)
    const store = useItemsStore()
    await store.fetchAll('list-1')
    expect(store.getItems('list-1')).toEqual(items)
  })

  it('fetchAll sets error when offline and no cache', async () => {
    mockItemService.getAll.mockRejectedValue(new Error('server'))
    const store = useItemsStore()
    await store.fetchAll('list-1')
    expect(store.error).toBeTruthy()
  })

  it('fetchAll stays silent when cached items exist and api fails', async () => {
    mockCacheService.getItems.mockResolvedValue([makeItem('i1', 'Milk')])
    mockItemService.getAll.mockRejectedValue(new Error('network'))
    const store = useItemsStore()
    await store.fetchAll('list-1')
    expect(store.error).toBeNull()
  })

  // ── create (online) ───────────────────────────────────────────────────

  it('create (online) appends item and saves to cache', async () => {
    const item = makeItem('i1', 'Milk')
    mockItemService.create.mockResolvedValue(item)
    const store = useItemsStore()
    const result = await store.create('list-1', { name: 'Milk' })
    expect(result).toEqual(item)
    expect(store.getItems('list-1')).toContainEqual(item)
    expect(mockCacheService.saveItem).toHaveBeenCalledWith(item)
  })

  it('create (online) calls syncCounts', async () => {
    mockItemService.create.mockResolvedValue(makeItem('i1', 'Milk'))
    const store = useItemsStore()
    await store.create('list-1', { name: 'Milk' })
    expect(mockPatchCounts).toHaveBeenCalledWith('list-1', 1, 0)
  })

  // ── create (offline) ─────────────────────────────────────────────────

  it('create (offline) applies locally and enqueues operation', async () => {
    mockItemService.create.mockRejectedValue(networkError())
    const store = useItemsStore()
    const item = await store.create('list-1', { name: 'Eggs' })
    expect(item.name).toBe('Eggs')
    expect(store.getItems('list-1')).toHaveLength(1)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_CREATE' }))
  })

  it('create (offline) re-throws non-network errors', async () => {
    const serverErr: any = new Error('validation')
    serverErr.isAxiosError = true
    serverErr.response = { status: 400 }
    mockItemService.create.mockRejectedValue(serverErr)
    const store = useItemsStore()
    await expect(store.create('list-1', { name: 'Bad' })).rejects.toThrow('validation')
  })

  // ── gateway errors (502/503/504) ──────────────────────────────────────

  it('toggleCheck (502) applies locally and enqueues', async () => {
    const item = makeItem('i1', 'Milk', false)
    mockItemService.getAll.mockResolvedValue([item])
    mockItemService.toggleCheck.mockRejectedValue(gatewayError(502))
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.toggleCheck('list-1', 'i1')
    expect(store.getItems('list-1')[0]!.checked).toBe(true)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_CHECK' }))
  })

  it('create (503) applies locally and enqueues', async () => {
    mockItemService.create.mockRejectedValue(gatewayError(503))
    const store = useItemsStore()
    const item = await store.create('list-1', { name: 'Butter' })
    expect(item.name).toBe('Butter')
    expect(store.getItems('list-1')).toHaveLength(1)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_CREATE' }))
  })

  it('remove (504) removes locally and enqueues delete', async () => {
    const items = [makeItem('i1', 'Milk')]
    mockItemService.getAll.mockResolvedValue(items)
    mockItemService.delete.mockRejectedValue(gatewayError(504))
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.remove('list-1', 'i1')
    expect(store.getItems('list-1')).toHaveLength(0)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_DELETE' }))
  })

  // ── toggleCheck (online) ──────────────────────────────────────────────

  it('toggleCheck (online) updates item in state', async () => {
    const item = makeItem('i1', 'Milk', false)
    const toggled = { ...item, checked: true }
    mockItemService.getAll.mockResolvedValue([item])
    mockItemService.toggleCheck.mockResolvedValue(toggled)
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.toggleCheck('list-1', 'i1')
    expect(store.getItems('list-1')[0]!.checked).toBe(true)
  })

  // ── toggleCheck (offline) ─────────────────────────────────────────────

  it('toggleCheck (offline) flips checked locally and enqueues', async () => {
    const item = makeItem('i1', 'Milk', false)
    mockItemService.getAll.mockResolvedValue([item])
    mockItemService.toggleCheck.mockRejectedValue(networkError())
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.toggleCheck('list-1', 'i1')
    expect(store.getItems('list-1')[0]!.checked).toBe(true)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_CHECK' }))
  })

  // ── remove (online) ───────────────────────────────────────────────────

  it('remove (online) filters out item from state', async () => {
    const items = [makeItem('i1', 'Milk'), makeItem('i2', 'Eggs')]
    mockItemService.getAll.mockResolvedValue(items)
    mockItemService.delete.mockResolvedValue(undefined)
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.remove('list-1', 'i1')
    expect(store.getItems('list-1').map(i => i.id)).toEqual(['i2'])
    expect(mockCacheService.removeItem).toHaveBeenCalledWith('i1')
  })

  // ── remove (offline) ─────────────────────────────────────────────────

  it('remove (offline) removes locally and enqueues delete', async () => {
    const items = [makeItem('i1', 'Milk')]
    mockItemService.getAll.mockResolvedValue(items)
    mockItemService.delete.mockRejectedValue(networkError())
    const store = useItemsStore()
    await store.fetchAll('list-1')
    await store.remove('list-1', 'i1')
    expect(store.getItems('list-1')).toHaveLength(0)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({ operationType: 'ITEM_DELETE' }))
  })
})
