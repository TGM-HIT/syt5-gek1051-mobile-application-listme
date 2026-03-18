import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('./api', () => ({ default: { get: mockGet } }))

import { budgetService } from './budget'

const summary = { total: 12.5, byCategory: { Obst: 5.0, Gemüse: 7.5 } }

describe('budgetService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('get calls GET /lists/:id/budget', async () => {
    mockGet.mockResolvedValue({ data: summary })
    const result = await budgetService.get('l1')
    expect(mockGet).toHaveBeenCalledWith('/lists/l1/budget')
    expect(result).toEqual(summary)
  })

  it('resolves with total and byCategory', async () => {
    mockGet.mockResolvedValue({ data: { total: 0, byCategory: {} } })
    const result = await budgetService.get('l2')
    expect(result.total).toBe(0)
    expect(result.byCategory).toEqual({})
  })
})
