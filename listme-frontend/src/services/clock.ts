import { cacheDb } from './db'

/**
 * Maintains a monotonically-increasing vector clock counter per (listId, deviceId)
 * in IndexedDB. Used to attach vector clocks to offline-queued CRDT operations.
 */
export const LocalClockService = {
  async getNextClock(listId: string, deviceId: string): Promise<Record<string, number>> {
    const row = (await cacheDb.localClocks.get([listId, deviceId])) ?? {
      listId,
      deviceId,
      counter: 0,
    }
    row.counter++
    await cacheDb.localClocks.put(row)
    return { [deviceId]: row.counter }
  },
}
