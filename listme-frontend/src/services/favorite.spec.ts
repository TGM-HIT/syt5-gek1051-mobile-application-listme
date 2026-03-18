import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { get: mockGet, post: mockPost, delete: mockDelete },
}))

import { favoriteService } from './favorite'

const favorite = { id: 'f1', itemName: 'Äpfel', quantityUnit: 'kg', price: null, imageUrl: null, useCount: 3, lastUsedAt: '' }

describe('favoriteService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll calls GET /favorites', async () => {
    mockGet.mockResolvedValue({ data: [favorite] })
    const result = await favoriteService.getAll()
    expect(mockGet).toHaveBeenCalledWith('/favorites')
    expect(result).toEqual([favorite])
  })

  it('create calls POST /favorites with payload', async () => {
    mockPost.mockResolvedValue({ data: favorite })
    const req = { itemName: 'Äpfel', quantityUnit: 'kg', price: null, imageUrl: null }
    const result = await favoriteService.create(req)
    expect(mockPost).toHaveBeenCalledWith('/favorites', req)
    expect(result).toEqual(favorite)
  })

  it('delete calls DELETE /favorites/:id', async () => {
    mockDelete.mockResolvedValue({})
    const result = await favoriteService.delete('f1')
    expect(mockDelete).toHaveBeenCalledWith('/favorites/f1')
    expect(result).toBeUndefined()
  })
})
