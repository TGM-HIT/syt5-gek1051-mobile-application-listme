import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockPut, mockDelete, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
  mockPatch: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete, patch: mockPatch },
}))

import { itemService } from './item'

const item = { id: 'i1', listId: 'l1', name: 'Äpfel', checked: false, position: 0, categoryId: null, categoryName: null, categoryColor: null, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [], createdAt: '', updatedAt: '', deletedAt: null, createdByDeviceId: null }

describe('itemService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll calls GET /lists/:id/items', async () => {
    mockGet.mockResolvedValue({ data: [item] })
    const result = await itemService.getAll('l1')
    expect(mockGet).toHaveBeenCalledWith('/lists/l1/items')
    expect(result).toEqual([item])
  })

  it('getTrash calls GET /lists/:id/items/trash', async () => {
    mockGet.mockResolvedValue({ data: [item] })
    const result = await itemService.getTrash('l1')
    expect(mockGet).toHaveBeenCalledWith('/lists/l1/items/trash')
    expect(result).toEqual([item])
  })

  it('create calls POST /lists/:id/items with payload', async () => {
    mockPost.mockResolvedValue({ data: item })
    const req = { name: 'Bananen', quantity: null, quantityUnit: null, price: null, imageUrl: null, categoryId: null, position: 0 }
    const result = await itemService.create('l1', req)
    expect(mockPost).toHaveBeenCalledWith('/lists/l1/items', req)
    expect(result).toEqual(item)
  })

  it('update calls PUT /lists/:listId/items/:itemId', async () => {
    mockPut.mockResolvedValue({ data: item })
    const req = { name: 'Birnen', quantity: null, quantityUnit: null, price: null, imageUrl: null, categoryId: null, position: 0 }
    const result = await itemService.update('l1', 'i1', req)
    expect(mockPut).toHaveBeenCalledWith('/lists/l1/items/i1', req)
    expect(result).toEqual(item)
  })

  it('toggleCheck calls PATCH /lists/:listId/items/:itemId/check', async () => {
    mockPatch.mockResolvedValue({ data: { ...item, checked: true } })
    const result = await itemService.toggleCheck('l1', 'i1')
    expect(mockPatch).toHaveBeenCalledWith('/lists/l1/items/i1/check')
    expect(result.checked).toBe(true)
  })

  it('delete calls DELETE /lists/:listId/items/:itemId', async () => {
    mockDelete.mockResolvedValue({})
    const result = await itemService.delete('l1', 'i1')
    expect(mockDelete).toHaveBeenCalledWith('/lists/l1/items/i1')
    expect(result).toBeUndefined()
  })

  it('restore calls PATCH /lists/:listId/items/:itemId/restore', async () => {
    mockPatch.mockResolvedValue({ data: item })
    const result = await itemService.restore('l1', 'i1')
    expect(mockPatch).toHaveBeenCalledWith('/lists/l1/items/i1/restore')
    expect(result).toEqual(item)
  })

  it('permanentDelete calls DELETE /lists/:listId/items/:itemId/permanent', async () => {
    mockDelete.mockResolvedValue({})
    const result = await itemService.permanentDelete('l1', 'i1')
    expect(mockDelete).toHaveBeenCalledWith('/lists/l1/items/i1/permanent')
    expect(result).toBeUndefined()
  })
})
