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

  /** Returns the full vector clock for a list (all devices seen so far). */
  async getClock(listId: string): Promise<Record<string, number>> {
    const rows = await cacheDb.localClocks.where('listId').equals(listId).toArray()
    const clock: Record<string, number> = {}
    for (const row of rows) clock[row.deviceId] = row.counter
    return clock
  },

  /** Max-merges an incoming clock map into the stored clocks for a list. */
  async mergeClock(listId: string, incoming: Record<string, number>): Promise<void> {
    for (const [deviceId, counter] of Object.entries(incoming)) {
      const row = (await cacheDb.localClocks.get([listId, deviceId])) ?? {
        listId,
        deviceId,
        counter: 0,
      }
      if (counter > row.counter) {
        row.counter = counter
        await cacheDb.localClocks.put(row)
      }
    }
  },
}
