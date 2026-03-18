import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mock Dexie at module level so the DeviceDb class uses fake tables ──────
// TypeScript class field `meta!` in DeviceDb overrides the parent's instance
// property, so we instead stub the db variable by mocking the module after
// import via vi.spyOn on the prototype.
const { mockTableGet, mockTablePut, mockApiGet } = vi.hoisted(() => ({
  mockTableGet: vi.fn(),
  mockTablePut: vi.fn(),
  mockApiGet: vi.fn(),
}))

vi.mock('./api', () => ({ default: { get: mockApiGet } }))

// Mock Dexie — return a class whose instances expose the meta table
vi.mock('dexie', () => {
  return {
    default: class FakeDexie {
      // These methods must exist to satisfy DeviceDb constructor
      version(_v: number) { return { stores: (_schema: unknown) => {} } }
    },
  }
})

import { deviceService } from './device'

describe('deviceService.get', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls GET /devices/:id', async () => {
    const info = { id: 'dev1', displayName: 'Alice', createdAt: '' }
    mockApiGet.mockResolvedValue({ data: info })
    const result = await deviceService.get('dev1')
    expect(mockApiGet).toHaveBeenCalledWith('/devices/dev1')
    expect(result).toEqual(info)
  })

  it('returns the device info from response', async () => {
    const info = { id: 'dev2', displayName: null, createdAt: '2025-01-01T00:00:00Z' }
    mockApiGet.mockResolvedValue({ data: info })
    expect(await deviceService.get('dev2')).toEqual(info)
  })
})
