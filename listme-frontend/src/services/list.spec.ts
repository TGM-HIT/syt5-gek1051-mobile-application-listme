import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
}))

import { listService } from './list'

const list = { id: 'l1', name: 'Wocheneinkauf', emoji: '🛒', shareToken: null, itemCount: 0, checkedCount: 0, participantCount: 1, createdAt: '', updatedAt: '' }

describe('listService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll', () => {
    it('calls GET /lists', async () => {
      mockGet.mockResolvedValue({ data: [] })
      await listService.getAll()
      expect(mockGet).toHaveBeenCalledWith('/lists')
    })

    it('returns response data', async () => {
      mockGet.mockResolvedValue({ data: [list] })
      const result = await listService.getAll()
      expect(result).toEqual([list])
    })
  })

  describe('getOne', () => {
    it('calls GET /lists/:id', async () => {
      mockGet.mockResolvedValue({ data: list })
      await listService.getOne('l1')
      expect(mockGet).toHaveBeenCalledWith('/lists/l1')
    })

    it('returns the list', async () => {
      mockGet.mockResolvedValue({ data: list })
      expect(await listService.getOne('l1')).toEqual(list)
    })
  })

  describe('create', () => {
    it('calls POST /lists with payload', async () => {
      mockPost.mockResolvedValue({ data: list })
      await listService.create({ name: 'Test', emoji: '🛒', presetId: null })
      expect(mockPost).toHaveBeenCalledWith('/lists', { name: 'Test', emoji: '🛒', presetId: null })
    })

    it('returns created list', async () => {
      mockPost.mockResolvedValue({ data: list })
      expect(await listService.create({ name: 'Test', emoji: '🛒', presetId: null })).toEqual(list)
    })
  })

  describe('update', () => {
    it('calls PUT /lists/:id with payload', async () => {
      mockPut.mockResolvedValue({ data: list })
      await listService.update('l1', { name: 'Updated', emoji: '🏠' })
      expect(mockPut).toHaveBeenCalledWith('/lists/l1', { name: 'Updated', emoji: '🏠' })
    })

    it('returns updated list', async () => {
      mockPut.mockResolvedValue({ data: list })
      expect(await listService.update('l1', { name: 'X', emoji: '🏠' })).toEqual(list)
    })
  })

  describe('delete', () => {
    it('calls DELETE /lists/:id', async () => {
      mockDelete.mockResolvedValue({})
      await listService.delete('l1')
      expect(mockDelete).toHaveBeenCalledWith('/lists/l1')
    })

    it('returns undefined', async () => {
      mockDelete.mockResolvedValue({})
      expect(await listService.delete('l1')).toBeUndefined()
    })
  })

  describe('duplicate', () => {
    it('calls POST /lists/:id/duplicate', async () => {
      mockPost.mockResolvedValue({ data: list })
      await listService.duplicate('l1')
      expect(mockPost).toHaveBeenCalledWith('/lists/l1/duplicate')
    })

    it('returns duplicated list', async () => {
      mockPost.mockResolvedValue({ data: list })
      expect(await listService.duplicate('l1')).toEqual(list)
    })
  })
})
