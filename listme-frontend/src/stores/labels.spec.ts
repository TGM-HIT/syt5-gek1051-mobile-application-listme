import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Label } from '../types'

const { mockLabelService } = vi.hoisted(() => ({
  mockLabelService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../services/label', () => ({ labelService: mockLabelService }))

import { useLabelsStore } from './labels'

function makeLabel(id: string, name: string): Label {
  return { id, name, color: '#fff', listId: 'list-1' } as Label
}

describe('useLabelsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('getForList returns empty array for unknown list', () => {
    const store = useLabelsStore()
    expect(store.getForList('list-1')).toEqual([])
  })

  it('fetchForList populates labelsByList', async () => {
    const labels = [makeLabel('l1', 'Fresh'), makeLabel('l2', 'Urgent')]
    mockLabelService.getAll.mockResolvedValue(labels)
    const store = useLabelsStore()
    await store.fetchForList('list-1')
    expect(store.getForList('list-1')).toEqual(labels)
  })

  it('fetchForList silently ignores errors', async () => {
    mockLabelService.getAll.mockRejectedValue(new Error('network'))
    const store = useLabelsStore()
    await expect(store.fetchForList('list-1')).resolves.not.toThrow()
  })

  it('create adds label to labelsByList', async () => {
    const label = makeLabel('l3', 'New')
    mockLabelService.create.mockResolvedValue(label)
    const store = useLabelsStore()
    const result = await store.create('list-1', { name: 'New', color: '#fff' })
    expect(result).toEqual(label)
    expect(store.getForList('list-1')).toContainEqual(label)
  })

  it('create initializes list entry when missing', async () => {
    const label = makeLabel('l4', 'Init')
    mockLabelService.create.mockResolvedValue(label)
    const store = useLabelsStore()
    await store.create('brand-new-list', { name: 'Init', color: '#000' })
    expect(store.getForList('brand-new-list')).toHaveLength(1)
  })

  it('remove filters out the deleted label', async () => {
    const labels = [makeLabel('l1', 'A'), makeLabel('l2', 'B')]
    mockLabelService.getAll.mockResolvedValue(labels)
    mockLabelService.delete.mockResolvedValue(undefined)
    const store = useLabelsStore()
    await store.fetchForList('list-1')
    await store.remove('list-1', 'l1')
    expect(store.getForList('list-1').map(l => l.id)).toEqual(['l2'])
  })

  it('remove calls labelService.delete', async () => {
    mockLabelService.getAll.mockResolvedValue([makeLabel('l1', 'A')])
    mockLabelService.delete.mockResolvedValue(undefined)
    const store = useLabelsStore()
    await store.fetchForList('list-1')
    await store.remove('list-1', 'l1')
    expect(mockLabelService.delete).toHaveBeenCalledWith('list-1', 'l1')
  })
})
