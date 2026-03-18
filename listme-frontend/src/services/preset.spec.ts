import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { get: mockGet, post: mockPost, delete: mockDelete },
}))

import { presetService } from './preset'

const preset = { id: 'p1', name: 'Wochenmarkt', emoji: '🥦', itemCount: 5, createdAt: '' }
const presetItem = { id: 'pi1', name: 'Karotten', quantity: 1, quantityUnit: 'kg', price: null, imageUrl: null }

describe('presetService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll calls GET /presets', async () => {
    mockGet.mockResolvedValue({ data: [preset] })
    const result = await presetService.getAll()
    expect(mockGet).toHaveBeenCalledWith('/presets')
    expect(result).toEqual([preset])
  })

  it('getItems calls GET /presets/:id/items', async () => {
    mockGet.mockResolvedValue({ data: [presetItem] })
    const result = await presetService.getItems('p1')
    expect(mockGet).toHaveBeenCalledWith('/presets/p1/items')
    expect(result).toEqual([presetItem])
  })

  it('create calls POST /presets with name, emoji, fromListId', async () => {
    mockPost.mockResolvedValue({ data: preset })
    const result = await presetService.create('Wochenmarkt', '🥦', 'l1')
    expect(mockPost).toHaveBeenCalledWith('/presets', { name: 'Wochenmarkt', emoji: '🥦', fromListId: 'l1' })
    expect(result).toEqual(preset)
  })

  it('delete calls DELETE /presets/:id', async () => {
    mockDelete.mockResolvedValue({})
    const result = await presetService.delete('p1')
    expect(mockDelete).toHaveBeenCalledWith('/presets/p1')
    expect(result).toBeUndefined()
  })
})
