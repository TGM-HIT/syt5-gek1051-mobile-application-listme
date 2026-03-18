import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('./api', () => ({ default: { get: mockGet } }))

let mockItemsByList: Record<string, any[]> = {}
vi.mock('../stores/items', () => ({
  useItemsStore: () => ({ itemsByList: mockItemsByList }),
}))

import { searchHistory, loadHistory } from './itemHistory'

function apiResponse(data: any[]) {
  return Promise.resolve({ data })
}

describe('searchHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockItemsByList = {}
    mockGet.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty array for query shorter than 2 chars', async () => {
    const promise = searchHistory('a')
    vi.advanceTimersByTime(300)
    expect(await promise).toEqual([])
  })

  it('returns empty array for empty query', async () => {
    const promise = searchHistory('')
    vi.advanceTimersByTime(300)
    expect(await promise).toEqual([])
  })

  it('calls api after 200ms debounce', async () => {
    const suggestions = [{ name: 'Milk', quantityUnit: null, price: null, imageUrl: null }]
    mockGet.mockReturnValue(apiResponse(suggestions))
    const promise = searchHistory('mi')
    vi.advanceTimersByTime(200)
    expect(await promise).toEqual(suggestions)
    expect(mockGet).toHaveBeenCalledWith('/items/history', { params: { q: 'mi', limit: 8 } })
  })

  it('debounces rapid calls, only fires once', async () => {
    mockGet.mockReturnValue(apiResponse([]))
    searchHistory('mi')
    searchHistory('mil')
    const promise = searchHistory('milk')
    vi.advanceTimersByTime(200)
    await promise
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('/items/history', { params: { q: 'milk', limit: 8 } })
  })

  it('falls back to pinia store when api throws', async () => {
    mockGet.mockReturnValue(Promise.reject(new Error('offline')))
    mockItemsByList = {
      'list-1': [
        { name: 'Milk', quantityUnit: 'L', price: 1.5, imageUrl: null },
        { name: 'Eggs', quantityUnit: null, price: null, imageUrl: null },
      ],
    }
    const promise = searchHistory('mi')
    vi.advanceTimersByTime(200)
    const results = await promise
    expect(results).toHaveLength(1)
    expect(results[0]!.name).toBe('Milk')
  })

  it('offline fallback deduplicates by lowercase name', async () => {
    mockGet.mockReturnValue(Promise.reject(new Error('offline')))
    mockItemsByList = {
      'list-1': [
        { name: 'Milk', quantityUnit: null, price: null, imageUrl: null },
        { name: 'milk', quantityUnit: 'L', price: 2, imageUrl: null },
      ],
    }
    const promise = searchHistory('mi')
    vi.advanceTimersByTime(200)
    const results = await promise
    expect(results).toHaveLength(1)
  })

  it('offline fallback respects limit', async () => {
    mockGet.mockReturnValue(Promise.reject(new Error('offline')))
    mockItemsByList = {
      'list-1': Array.from({ length: 20 }, (_, i) => ({
        name: `ab${i}`, quantityUnit: null, price: null, imageUrl: null,
      })),
    }
    const promise = searchHistory('ab', 5)
    vi.advanceTimersByTime(200)
    const results = await promise
    expect(results.length).toBeLessThanOrEqual(5)
  })
})

describe('loadHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockItemsByList = {}
    mockGet.mockReset()
  })

  it('returns data from api on success', async () => {
    const items = [{ name: 'Bread', quantityUnit: null, price: null, imageUrl: null }]
    mockGet.mockReturnValue(apiResponse(items))
    const result = await loadHistory()
    expect(result).toEqual(items)
  })

  it('falls back to pinia store on api failure', async () => {
    mockGet.mockReturnValue(Promise.reject(new Error('offline')))
    mockItemsByList = {
      'list-1': [
        { name: 'Butter', quantityUnit: null, price: null, imageUrl: null },
      ],
    }
    const result = await loadHistory()
    expect(result[0]!.name).toBe('Butter')
  })

  it('loadHistory deduplicates by lowercase name', async () => {
    mockGet.mockReturnValue(Promise.reject(new Error('offline')))
    mockItemsByList = {
      'list-1': [
        { name: 'Sugar', quantityUnit: null, price: null, imageUrl: null },
        { name: 'sugar', quantityUnit: null, price: null, imageUrl: null },
      ],
    }
    const result = await loadHistory()
    expect(result).toHaveLength(1)
  })
})
