import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mock cacheDb ───────────────────────────────────────────────────────────
const { mockGet, mockPut, mockWhere } = vi.hoisted(() => {
  const mockWhere = vi.fn()
  return { mockGet: vi.fn(), mockPut: vi.fn(), mockWhere }
})

vi.mock('./db', () => ({
  cacheDb: {
    localClocks: {
      get: mockGet,
      put: mockPut,
      where: mockWhere,
    },
  },
}))

import { LocalClockService } from './clock'

describe('LocalClockService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue(undefined)
  })

  it('returns { deviceId: 1 } when no existing counter', async () => {
    mockGet.mockResolvedValue(undefined) // no existing row
    const clock = await LocalClockService.getNextClock('l1', 'dev1')
    expect(clock).toEqual({ dev1: 1 })
  })

  it('increments existing counter', async () => {
    mockGet.mockResolvedValue({ listId: 'l1', deviceId: 'dev1', counter: 4 })
    const clock = await LocalClockService.getNextClock('l1', 'dev1')
    expect(clock).toEqual({ dev1: 5 })
  })

  it('persists the incremented counter via put', async () => {
    mockGet.mockResolvedValue({ listId: 'l1', deviceId: 'dev1', counter: 2 })
    await LocalClockService.getNextClock('l1', 'dev1')
    expect(mockPut).toHaveBeenCalledWith({ listId: 'l1', deviceId: 'dev1', counter: 3 })
  })

  it('uses compound key [listId, deviceId] for get', async () => {
    mockGet.mockResolvedValue(undefined)
    await LocalClockService.getNextClock('list-abc', 'device-xyz')
    expect(mockGet).toHaveBeenCalledWith(['list-abc', 'device-xyz'])
  })
})

describe('LocalClockService.getClock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const toArray = vi.fn()
    const equals = vi.fn().mockReturnValue({ toArray })
    mockWhere.mockReturnValue({ equals })
  })

  it('returns empty object when no rows exist', async () => {
    const toArray = vi.fn().mockResolvedValue([])
    mockWhere.mockReturnValue({ equals: vi.fn().mockReturnValue({ toArray }) })
    const clock = await LocalClockService.getClock('l1')
    expect(clock).toEqual({})
  })

  it('builds clock map from all rows for that list', async () => {
    const rows = [
      { listId: 'l1', deviceId: 'devA', counter: 3 },
      { listId: 'l1', deviceId: 'devB', counter: 7 },
    ]
    mockWhere.mockReturnValue({ equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(rows) }) })
    const clock = await LocalClockService.getClock('l1')
    expect(clock).toEqual({ devA: 3, devB: 7 })
  })

  it('queries by listId', async () => {
    const equalsMock = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    mockWhere.mockReturnValue({ equals: equalsMock })
    await LocalClockService.getClock('my-list')
    expect(mockWhere).toHaveBeenCalledWith('listId')
    expect(equalsMock).toHaveBeenCalledWith('my-list')
  })
})

describe('LocalClockService.mergeClock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue(undefined)
  })

  it('does nothing when incoming clock is empty', async () => {
    await LocalClockService.mergeClock('l1', {})
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('updates counter when incoming is higher', async () => {
    mockGet.mockResolvedValue({ listId: 'l1', deviceId: 'devA', counter: 2 })
    await LocalClockService.mergeClock('l1', { devA: 5 })
    expect(mockPut).toHaveBeenCalledWith({ listId: 'l1', deviceId: 'devA', counter: 5 })
  })

  it('does not update counter when incoming is lower or equal', async () => {
    mockGet.mockResolvedValue({ listId: 'l1', deviceId: 'devA', counter: 10 })
    await LocalClockService.mergeClock('l1', { devA: 3 })
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('creates new row when device not yet seen', async () => {
    mockGet.mockResolvedValue(undefined)
    await LocalClockService.mergeClock('l1', { devNew: 4 })
    expect(mockPut).toHaveBeenCalledWith({ listId: 'l1', deviceId: 'devNew', counter: 4 })
  })

  it('processes multiple devices in one call', async () => {
    mockGet
      .mockResolvedValueOnce({ listId: 'l1', deviceId: 'devA', counter: 1 })
      .mockResolvedValueOnce(undefined)
    await LocalClockService.mergeClock('l1', { devA: 3, devB: 2 })
    expect(mockPut).toHaveBeenCalledTimes(2)
  })
})
