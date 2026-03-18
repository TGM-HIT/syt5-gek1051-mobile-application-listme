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

import { labelService } from './label'

const label = { id: 'lb1', name: 'Bio', color: '#A6D189' }

describe('labelService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll calls GET /lists/:id/labels', async () => {
    mockGet.mockResolvedValue({ data: [label] })
    const result = await labelService.getAll('l1')
    expect(mockGet).toHaveBeenCalledWith('/lists/l1/labels')
    expect(result).toEqual([label])
  })

  it('create calls POST /lists/:id/labels with payload', async () => {
    mockPost.mockResolvedValue({ data: label })
    const result = await labelService.create('l1', { name: 'Bio', color: '#A6D189' })
    expect(mockPost).toHaveBeenCalledWith('/lists/l1/labels', { name: 'Bio', color: '#A6D189' })
    expect(result).toEqual(label)
  })

  it('update calls PUT /lists/:id/labels/:labelId', async () => {
    mockPut.mockResolvedValue({ data: label })
    const result = await labelService.update('l1', 'lb1', { name: 'Vegan', color: null })
    expect(mockPut).toHaveBeenCalledWith('/lists/l1/labels/lb1', { name: 'Vegan', color: null })
    expect(result).toEqual(label)
  })

  it('delete calls DELETE /lists/:id/labels/:labelId', async () => {
    mockDelete.mockResolvedValue({})
    const result = await labelService.delete('l1', 'lb1')
    expect(mockDelete).toHaveBeenCalledWith('/lists/l1/labels/lb1')
    expect(result).toBeUndefined()
  })
})
