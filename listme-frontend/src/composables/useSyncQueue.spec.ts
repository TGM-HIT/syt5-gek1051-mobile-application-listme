import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CrdtOperation } from '../crdt/types'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockGetAllPending, mockMarkAllSynced, mockPruneOld, mockPost, mockGet, mockFetchAll, mockIsOnline } =
  vi.hoisted(() => ({
    mockGetAllPending: vi.fn(),
    mockMarkAllSynced: vi.fn(),
    mockPruneOld: vi.fn(),
    mockPost: vi.fn(),
    mockGet: vi.fn().mockResolvedValue({ data: [] }),
    mockFetchAll: vi.fn(),
    // plain object (not Vue ref) — we test flushQueue directly, not the watch
    mockIsOnline: { value: true },
  }))

vi.mock('../crdt/OperationQueue', () => ({
  OperationQueue: {
    getAllPending: mockGetAllPending,
    markAllSynced: mockMarkAllSynced,
    pruneOld: mockPruneOld,
  },
}))

vi.mock('../services/api', () => ({ default: { post: mockPost, get: mockGet } }))

vi.mock('./useOffline', () => ({
  useOffline: () => ({ isOnline: mockIsOnline }),
}))

vi.mock('../stores/items', () => ({
  useItemsStore: () => ({ fetchAll: mockFetchAll, itemsByList: {}, getItems: () => [] }),
}))

vi.mock('../services/clock', () => ({
  LocalClockService: {
    getClock: vi.fn().mockResolvedValue({}),
    mergeClock: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../services/device', () => ({
  getDeviceId: vi.fn().mockResolvedValue('test-device-id'),
}))

vi.mock('./useListSync', () => ({
  applyOp: vi.fn(),
}))

vi.mock('../services/db', () => ({
  cacheDb: {
    pendingLists: { toArray: vi.fn().mockResolvedValue([]) },
    localClocks: { where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) }) },
  },
}))

vi.mock('../stores/lists', () => ({
  useListsStore: () => ({ lists: [], fetchAll: vi.fn() }),
}))

vi.mock('../services/list', () => ({
  listService: { create: vi.fn() },
}))

vi.mock('../services/cache', () => ({
  CacheService: { getItems: vi.fn().mockResolvedValue([]), saveList: vi.fn(), saveItems: vi.fn() },
}))

vi.mock('../services/websocket', () => ({
  onReconnect: vi.fn(),
}))

import { useSyncQueue } from './useSyncQueue'

function makeOp(id: string, listId: string): CrdtOperation {
  return {
    id,
    listId,
    deviceId: 'dev1',
    operationType: 'ITEM_CREATE',
    payload: {},
    vectorClock: { dev1: 1 },
    createdAt: Date.now(),
    synced: false,
  }
}

describe('useSyncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.value = true
    mockGetAllPending.mockResolvedValue([])
    mockMarkAllSynced.mockResolvedValue(undefined)
    mockPruneOld.mockResolvedValue(undefined)
    mockPost.mockResolvedValue({})
    mockFetchAll.mockResolvedValue([])
  })

  it('returns flushQueue function', () => {
    const { flushQueue } = useSyncQueue()
    expect(typeof flushQueue).toBe('function')
  })

  it('flushQueue returns empty array when no pending ops', async () => {
    mockGetAllPending.mockResolvedValue([])
    const { flushQueue } = useSyncQueue()
    const result = await flushQueue()
    expect(result).toEqual([])
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('flushQueue sends ops grouped by listId', async () => {
    const ops = [makeOp('op1', 'l1'), makeOp('op2', 'l1'), makeOp('op3', 'l2')]
    mockGetAllPending.mockResolvedValue(ops)
    const { flushQueue } = useSyncQueue()
    await flushQueue()
    expect(mockPost).toHaveBeenCalledWith('/lists/l1/crdt/ops', [ops[0], ops[1]])
    expect(mockPost).toHaveBeenCalledWith('/lists/l2/crdt/ops', [ops[2]])
  })

  it('flushQueue returns list of flushed listIds', async () => {
    const ops = [makeOp('op1', 'l1'), makeOp('op2', 'l2')]
    mockGetAllPending.mockResolvedValue(ops)
    const { flushQueue } = useSyncQueue()
    const result = await flushQueue()
    expect(result).toContain('l1')
    expect(result).toContain('l2')
  })

  it('flushQueue calls markAllSynced with synced op ids', async () => {
    const ops = [makeOp('op1', 'l1')]
    mockGetAllPending.mockResolvedValue(ops)
    const { flushQueue } = useSyncQueue()
    await flushQueue()
    expect(mockMarkAllSynced).toHaveBeenCalledWith(['op1'])
  })

  it('flushQueue calls pruneOld after syncing', async () => {
    const ops = [makeOp('op1', 'l1')]
    mockGetAllPending.mockResolvedValue(ops)
    const { flushQueue } = useSyncQueue()
    await flushQueue()
    expect(mockPruneOld).toHaveBeenCalled()
  })

  it('flushQueue skips failed list but continues others', async () => {
    const ops = [makeOp('op1', 'l1'), makeOp('op2', 'l2')]
    mockGetAllPending.mockResolvedValue(ops)
    mockPost
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({})
    const { flushQueue } = useSyncQueue()
    const result = await flushQueue()
    // l1 failed, l2 succeeded
    expect(result).not.toContain('l1')
    expect(result).toContain('l2')
  })

  it('flushQueue does not call markAllSynced when all fail', async () => {
    const ops = [makeOp('op1', 'l1')]
    mockGetAllPending.mockResolvedValue(ops)
    mockPost.mockRejectedValue(new Error('fail'))
    const { flushQueue } = useSyncQueue()
    await flushQueue()
    expect(mockMarkAllSynced).not.toHaveBeenCalled()
  })
})
