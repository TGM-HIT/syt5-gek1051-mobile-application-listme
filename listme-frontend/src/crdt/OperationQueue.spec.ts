import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { CrdtOperation } from './types'

// ── Dexie mock ────────────────────────────────────────────────────────────────
// Must be hoisted so the factory runs before OperationQueue is imported.

const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUpdate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockBulkUpdate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockSortBy = vi.hoisted(() => vi.fn().mockResolvedValue([]))
const mockDelete = vi.hoisted(() => vi.fn().mockResolvedValue(0))

vi.mock('dexie', () => {
  // Native class fields reset `this.queue` to undefined AFTER super() but BEFORE
  // stores() is called. We set the mock queue inside stores() using a closure so it
  // runs last and wins.
  class MockDexie {
    constructor(_name: string) {}
    version(_n: number) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this as unknown as Record<string, unknown>
      return {
        stores: (_s: Record<string, string>) => {
          self['queue'] = {
            put: mockPut,
            update: mockUpdate,
            bulkUpdate: mockBulkUpdate,
            where: vi.fn().mockReturnValue({
              equals: vi.fn().mockReturnValue({
                and: vi.fn().mockReturnValue({
                  sortBy: mockSortBy,
                  delete: mockDelete,
                }),
                sortBy: mockSortBy,
              }),
            }),
          }
        },
      }
    }
  }
  return { default: MockDexie }
})

import { OperationQueue } from './OperationQueue'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeOp(id: string, listId = 'list-1', createdAt = 1000): CrdtOperation {
  return {
    id,
    listId,
    deviceId: 'dev-A',
    operationType: 'ITEM_CREATE',
    payload: {},
    vectorClock: {},
    createdAt,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('OperationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSortBy.mockResolvedValue([])
  })

  describe('enqueue', () => {
    it('calls db.queue.put with _synced=0', async () => {
      const op = makeOp('op-1')
      await OperationQueue.enqueue(op)
      expect(mockPut).toHaveBeenCalledWith({ ...op, _synced: 0 })
    })

    it('stores each op independently', async () => {
      await OperationQueue.enqueue(makeOp('op-1'))
      await OperationQueue.enqueue(makeOp('op-2'))
      expect(mockPut).toHaveBeenCalledTimes(2)
    })
  })

  describe('getPending', () => {
    it('returns ops from the mock db', async () => {
      const ops = [makeOp('op-1'), makeOp('op-2')]
      mockSortBy.mockResolvedValueOnce(ops)
      const result = await OperationQueue.getPending('list-1')
      expect(result).toEqual(ops)
    })

    it('returns empty array when no pending ops', async () => {
      mockSortBy.mockResolvedValueOnce([])
      const result = await OperationQueue.getPending('list-1')
      expect(result).toEqual([])
    })
  })

  describe('getAllPending', () => {
    it('returns all pending ops across lists', async () => {
      const ops = [makeOp('op-1', 'list-1'), makeOp('op-2', 'list-2')]
      mockSortBy.mockResolvedValueOnce(ops)
      const result = await OperationQueue.getAllPending()
      expect(result).toEqual(ops)
    })
  })

  describe('markSynced', () => {
    it('updates the op to _synced=1', async () => {
      await OperationQueue.markSynced('op-1')
      expect(mockUpdate).toHaveBeenCalledWith('op-1', { _synced: 1 })
    })
  })

  describe('markAllSynced', () => {
    it('bulk-updates all given ids to _synced=1', async () => {
      await OperationQueue.markAllSynced(['op-1', 'op-2'])
      expect(mockBulkUpdate).toHaveBeenCalledWith([
        { key: 'op-1', changes: { _synced: 1 } },
        { key: 'op-2', changes: { _synced: 1 } },
      ])
    })

    it('handles empty array without error', async () => {
      await OperationQueue.markAllSynced([])
      expect(mockBulkUpdate).toHaveBeenCalledWith([])
    })
  })

  describe('pruneOld', () => {
    it('calls delete on old synced ops', async () => {
      await OperationQueue.pruneOld()
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
