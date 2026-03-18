import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ShoppingList, Item } from '../types'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockLists, mockItems } = vi.hoisted(() => ({
  mockLists: {
    bulkPut: vi.fn(),
    put: vi.fn(),
    orderBy: vi.fn(),
    delete: vi.fn(),
  },
  mockItems: {
    bulkPut: vi.fn(),
    put: vi.fn(),
    where: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('./db', () => ({
  cacheDb: { lists: mockLists, items: mockItems },
}))

import { CacheService } from './cache'

const list: ShoppingList = {
  id: 'l1', name: 'Test', emoji: '🛒', shareToken: null,
  itemCount: 1, checkedCount: 0, participantCount: 1, createdAt: '', updatedAt: '',
}

const item: Item = {
  id: 'i1', listId: 'l1', name: 'Äpfel', checked: false, position: 0,
  categoryId: null, categoryName: null, categoryColor: null,
  quantity: null, quantityUnit: null, price: null, imageUrl: null,
  labels: [], createdAt: '', updatedAt: '', deletedAt: null, createdByDeviceId: null,
}

const itemsWhereChain = (rows: unknown[] = []) => ({
  equals: () => ({
    delete: vi.fn().mockResolvedValue(undefined),
    toArray: async () => rows,
  }),
})

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLists.orderBy.mockReturnValue({ reverse: () => ({ toArray: async () => [] }) })
    mockLists.delete.mockResolvedValue(undefined)
    mockLists.bulkPut.mockResolvedValue(undefined)
    mockLists.put.mockResolvedValue(undefined)
    mockItems.bulkPut.mockResolvedValue(undefined)
    mockItems.put.mockResolvedValue(undefined)
    mockItems.delete.mockResolvedValue(undefined)
    mockItems.update.mockResolvedValue(undefined)
    mockItems.where.mockReturnValue(itemsWhereChain())
  })

  it('saveLists calls bulkPut with _savedAt annotation', async () => {
    await CacheService.saveLists([list])
    expect(mockLists.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'l1', _savedAt: expect.any(Number) })])
    )
  })

  it('saveList calls put with _savedAt annotation', async () => {
    await CacheService.saveList(list)
    expect(mockLists.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1', _savedAt: expect.any(Number) }))
  })

  it('getLists returns lists without _savedAt field', async () => {
    mockLists.orderBy.mockReturnValue({
      reverse: () => ({ toArray: async () => [{ ...list, _savedAt: 12345 }] }),
    })
    const result = await CacheService.getLists()
    expect(result[0]).not.toHaveProperty('_savedAt')
    expect(result[0]?.id).toBe('l1')
  })

  it('removeList deletes list and its items', async () => {
    const deleteItems = vi.fn().mockResolvedValue(undefined)
    mockItems.where.mockReturnValue({ equals: () => ({ delete: deleteItems }) })
    await CacheService.removeList('l1')
    expect(mockLists.delete).toHaveBeenCalledWith('l1')
    expect(deleteItems).toHaveBeenCalled()
  })

  it('saveItems clears existing items then bulkPuts', async () => {
    const deleteExisting = vi.fn().mockResolvedValue(undefined)
    mockItems.where.mockReturnValue({ equals: () => ({ delete: deleteExisting }) })
    await CacheService.saveItems('l1', [item])
    expect(deleteExisting).toHaveBeenCalled()
    expect(mockItems.bulkPut).toHaveBeenCalled()
  })

  it('saveItems skips bulkPut when array is empty', async () => {
    const deleteExisting = vi.fn().mockResolvedValue(undefined)
    mockItems.where.mockReturnValue({ equals: () => ({ delete: deleteExisting }) })
    await CacheService.saveItems('l1', [])
    expect(mockItems.bulkPut).not.toHaveBeenCalled()
  })

  it('saveItem calls put with _savedAt annotation', async () => {
    await CacheService.saveItem(item)
    expect(mockItems.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1', _savedAt: expect.any(Number) }))
  })

  it('getItems returns items sorted by position without _savedAt', async () => {
    const i2 = { ...item, id: 'i2', position: 1, _savedAt: 100 }
    const i1 = { ...item, id: 'i1', position: 0, _savedAt: 200 }
    mockItems.where.mockReturnValue({ equals: () => ({ toArray: async () => [i2, i1] }) })
    const result = await CacheService.getItems('l1')
    expect(result[0]?.id).toBe('i1')
    expect(result[1]?.id).toBe('i2')
    expect(result[0]).not.toHaveProperty('_savedAt')
  })

  it('removeItem calls items.delete with itemId', async () => {
    await CacheService.removeItem('i1')
    expect(mockItems.delete).toHaveBeenCalledWith('i1')
  })

  it('patchItem calls items.update with changes', async () => {
    await CacheService.patchItem('i1', { checked: true })
    expect(mockItems.update).toHaveBeenCalledWith('i1', { checked: true })
  })
})
