import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList } from '../types'

const { mockListService, mockCacheService } = vi.hoisted(() => ({
  mockListService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
  mockCacheService: {
    getLists: vi.fn().mockResolvedValue([]),
    saveLists: vi.fn().mockResolvedValue(undefined),
    saveList: vi.fn().mockResolvedValue(undefined),
    removeList: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../services/list', () => ({ listService: mockListService }))
vi.mock('../services/cache', () => ({ CacheService: mockCacheService }))
vi.mock('../services/db', () => ({ cacheDb: { pendingLists: { toArray: vi.fn().mockResolvedValue([]) } } }))

import { useListsStore } from './lists'

function makeList(id: string, name: string): ShoppingList {
  return { id, name, emoji: '🛒', itemCount: 0, checkedCount: 0 } as ShoppingList
}

describe('useListsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockCacheService.getLists.mockResolvedValue([])
    mockCacheService.saveLists.mockResolvedValue(undefined)
    mockCacheService.saveList.mockResolvedValue(undefined)
    mockCacheService.removeList.mockResolvedValue(undefined)
  })

  // ── fetchAll ──────────────────────────────────────────────────────────

  it('fetchAll populates lists from service', async () => {
    const lists = [makeList('l1', 'Weekly')]
    mockListService.getAll.mockResolvedValue(lists)
    const store = useListsStore()
    await store.fetchAll()
    expect(store.lists).toEqual(lists)
  })

  it('fetchAll serves cached data first when available', async () => {
    const cached = [makeList('l1', 'Cached')]
    mockCacheService.getLists.mockResolvedValue(cached)
    mockListService.getAll.mockResolvedValue([makeList('l1', 'Fresh')])
    const store = useListsStore()
    const fetchPromise = store.fetchAll()
    // After first await tick, cache is served
    await Promise.resolve()
    expect(store.lists).toEqual(cached)
    await fetchPromise
    // After full resolution, fresh data wins
    expect(store.lists[0]!.name).toBe('Fresh')
  })

  it('fetchAll sets error when offline and no cache', async () => {
    mockCacheService.getLists.mockResolvedValue([])
    mockListService.getAll.mockRejectedValue(new Error('network'))
    const store = useListsStore()
    await store.fetchAll()
    expect(store.error).toBeTruthy()
  })

  it('fetchAll stays silent on error when cached data exists', async () => {
    mockCacheService.getLists.mockResolvedValue([makeList('l1', 'Cached')])
    mockListService.getAll.mockRejectedValue(new Error('network'))
    const store = useListsStore()
    await store.fetchAll()
    expect(store.error).toBeNull()
  })

  // ── create ────────────────────────────────────────────────────────────

  it('create prepends new list and saves to cache', async () => {
    const existing = makeList('l1', 'Existing')
    const newList = makeList('l2', 'New')
    mockCacheService.getLists.mockResolvedValue([existing])
    mockListService.getAll.mockResolvedValue([existing])
    mockListService.create.mockResolvedValue(newList)
    const store = useListsStore()
    await store.fetchAll()
    await store.create({ name: 'New', emoji: '🛒' })
    expect(store.lists[0]).toEqual(newList)
    expect(mockCacheService.saveList).toHaveBeenCalledWith(newList)
  })

  // ── update ────────────────────────────────────────────────────────────

  it('update replaces list in state and cache', async () => {
    const original = makeList('l1', 'Old')
    const updated = makeList('l1', 'Updated')
    mockListService.getAll.mockResolvedValue([original])
    mockListService.update.mockResolvedValue(updated)
    const store = useListsStore()
    await store.fetchAll()
    await store.update('l1', { name: 'Updated', emoji: '🛒' })
    expect(store.lists[0]!.name).toBe('Updated')
    expect(mockCacheService.saveList).toHaveBeenCalledWith(updated)
  })

  // ── remove ────────────────────────────────────────────────────────────

  it('remove filters out the deleted list', async () => {
    const lists = [makeList('l1', 'A'), makeList('l2', 'B')]
    mockListService.getAll.mockResolvedValue(lists)
    mockListService.delete.mockResolvedValue(undefined)
    const store = useListsStore()
    await store.fetchAll()
    await store.remove('l1')
    expect(store.lists.map(l => l.id)).toEqual(['l2'])
    expect(mockCacheService.removeList).toHaveBeenCalledWith('l1')
  })

  // ── getById ───────────────────────────────────────────────────────────

  it('getById returns the matching list', async () => {
    mockListService.getAll.mockResolvedValue([makeList('l1', 'Weekly')])
    const store = useListsStore()
    await store.fetchAll()
    expect(store.getById('l1')?.name).toBe('Weekly')
  })

  it('getById returns undefined for unknown id', () => {
    const store = useListsStore()
    expect(store.getById('missing')).toBeUndefined()
  })

  // ── patchCounts ───────────────────────────────────────────────────────

  it('patchCounts updates itemCount and checkedCount', async () => {
    mockListService.getAll.mockResolvedValue([makeList('l1', 'A')])
    const store = useListsStore()
    await store.fetchAll()
    store.patchCounts('l1', 5, 3)
    expect(store.lists[0]!.itemCount).toBe(5)
    expect(store.lists[0]!.checkedCount).toBe(3)
  })

  // ── duplicate ─────────────────────────────────────────────────────────

  it('duplicate appends copy to lists and saves to cache', async () => {
    const original = makeList('l1', 'A')
    const copy = makeList('l2', 'A (copy)')
    mockListService.getAll.mockResolvedValue([original])
    mockListService.duplicate.mockResolvedValue(copy)
    const store = useListsStore()
    await store.fetchAll()
    const result = await store.duplicate('l1')
    expect(result).toEqual(copy)
    expect(store.lists).toContainEqual(copy)
    expect(mockCacheService.saveList).toHaveBeenCalledWith(copy)
  })
})
