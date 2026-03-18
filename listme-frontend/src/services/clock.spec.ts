import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mock cacheDb ───────────────────────────────────────────────────────────
const { mockGet, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}))

vi.mock('./db', () => ({
  cacheDb: { localClocks: { get: mockGet, put: mockPut } },
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
