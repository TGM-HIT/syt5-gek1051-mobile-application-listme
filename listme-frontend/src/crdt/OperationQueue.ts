import Dexie from 'dexie'
import type { CrdtOperation } from './types'

/**
 * Persistent offline operation queue backed by IndexedDB.
 *
 * When the device is offline, mutations are stored here.
 * On reconnect, they are flushed to the server in order.
 */
class OperationQueueDb extends Dexie {
  queue!: Dexie.Table<CrdtOperation & { _synced: 0 | 1 }, string>

  constructor() {
    super('listme-opqueue')
    this.version(1).stores({
      queue: 'id, listId, createdAt, _synced',
    })
  }
}

const db = new OperationQueueDb()

export const OperationQueue = {
  /** Enqueue an operation to be synced later. */
  async enqueue(op: CrdtOperation): Promise<void> {
    await db.queue.put({ ...op, _synced: 0 })
  },

  /** Return all unsynced operations for a list, oldest first. */
  async getPending(listId: string): Promise<CrdtOperation[]> {
    return db.queue
      .where('listId').equals(listId)
      .and(op => op._synced === 0)
      .sortBy('createdAt')
  },

  /** Return ALL unsynced operations across all lists, oldest first. */
  async getAllPending(): Promise<CrdtOperation[]> {
    return db.queue
      .where('_synced').equals(0)
      .sortBy('createdAt')
  },

  /** Mark an operation as successfully synced. */
  async markSynced(opId: string): Promise<void> {
    await db.queue.update(opId, { _synced: 1 })
  },

  /** Mark multiple operations as synced (batch). */
  async markAllSynced(opIds: string[]): Promise<void> {
    await db.queue.bulkUpdate(opIds.map(id => ({ key: id, changes: { _synced: 1 as const } })))
  },

  /** Remove synced operations older than given age (ms) to keep DB small. */
  async pruneOld(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAgeMs
    await db.queue
      .where('_synced').equals(1)
      .and(op => op.createdAt < cutoff)
      .delete()
  },
}
