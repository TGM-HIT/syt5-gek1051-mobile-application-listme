import { watch, onMounted } from 'vue'
import { OperationQueue } from '../crdt/OperationQueue'
import api from '../services/api'
import { useOffline } from './useOffline'
import { useItemsStore } from '../stores/items'
import { useListsStore } from '../stores/lists'
import { onReconnect } from '../services/websocket'
import { listService } from '../services/list'
import { CacheService } from '../services/cache'
import { cacheDb } from '../services/db'
import { LocalClockService } from '../services/clock'
import { getDeviceId } from '../services/device'
import { applyOp } from './useListSync'
import type { CrdtOperation } from '../crdt/types'

let flushInProgress = false
let reconnectListenerRegistered = false

/**
 * Composable that watches the online state and flushes any queued CRDT
 * operations to the server whenever connectivity is restored.
 *
 * Mount once at the App root. Each list-detail view enqueues operations
 * while offline via OperationQueue.enqueue(); this composable drains them.
 */
export function useSyncQueue() {
  const { isOnline } = useOffline()

  // Flush ops queued in a previous session (app opened while already online)
  onMounted(async () => {
    if (isOnline.value) await flushAll()
  })

  // Flush when navigator.onLine recovers (full network loss scenario)
  watch(isOnline, async (online) => {
    if (online) await flushAll()
  })

  // Also flush when the WebSocket reconnects after a server-side drop
  // (navigator.onLine stays true, but the WS connection was lost temporarily)
  if (!reconnectListenerRegistered) {
    reconnectListenerRegistered = true
    onReconnect(() => flushAll())
  }

  return { flushQueue }
}

async function flushAll(): Promise<void> {
  await flushPendingLists()
  const flushedLists = await flushQueue()
  // Re-fetch items for every list that had ops sent so the cache reflects the
  // server's acknowledged state (e.g. confirmed checked status after offline use).
  // fetchAll is a no-op visually when items already exist (no loading flash).
  if (flushedLists.length > 0) {
    const itemsStore = useItemsStore()
    await Promise.all(flushedLists.map(id => itemsStore.fetchAll(id)))
  }
}

/**
 * Creates any lists that were created offline (with a temp UUID) on the server,
 * then remaps the temp UUID to the server-assigned UUID in the Pinia store,
 * IndexedDB cache, and OperationQueue so subsequent CRDT op flush uses the
 * correct listId.
 */
async function flushPendingLists(): Promise<void> {
  const pending = await cacheDb.pendingLists.toArray()
  if (pending.length === 0) return

  const listsStore = useListsStore()
  const itemsStore = useItemsStore()

  for (const p of pending) {
    try {
      const serverList = await listService.create({ name: p.name, emoji: p.emoji })
      const serverId = serverList.id

      // Remap any queued CRDT ops (e.g. ITEM_CREATE) from tempId → serverId
      await OperationQueue.remapListId(p.tempId, serverId)

      // Remap cached items from tempId → serverId
      const cachedItems = await CacheService.getItems(p.tempId)
      await cacheDb.lists.delete(p.tempId)
      await cacheDb.items.where('listId').equals(p.tempId).delete()
      await CacheService.saveList(serverList)
      if (cachedItems.length > 0) {
        await CacheService.saveItems(serverId, cachedItems.map(i => ({ ...i, listId: serverId })))
      }

      // Remap Pinia store: replace the temp list entry in-place
      const listIdx = listsStore.lists.findIndex(l => l.id === p.tempId)
      if (listIdx !== -1) listsStore.lists[listIdx] = serverList

      // Remap items store from tempId → serverId
      const tempItems = itemsStore.itemsByList[p.tempId]
      if (tempItems) {
        itemsStore.itemsByList[serverId] = tempItems.map(i => ({ ...i, listId: serverId }))
        delete itemsStore.itemsByList[p.tempId]
      }

      await cacheDb.pendingLists.delete(p.tempId)
    } catch (e) {
      console.warn('[SyncQueue] Failed to flush pending list', p.tempId, e)
    }
  }
}

async function pullRemoteOps(
  listId: string,
  myDeviceId: string,
  itemsStore: ReturnType<typeof useItemsStore>,
): Promise<void> {
  try {
    const clock = await LocalClockService.getClock(listId)
    const since = JSON.stringify(clock)
    const { data } = await api.get<CrdtOperation[]>(`/lists/${listId}/crdt/ops`, {
      params: { since },
    })
    const remoteOps = (data ?? []).filter((op) => op.deviceId !== myDeviceId)
    for (const op of remoteOps) {
      applyOp(listId, op, itemsStore)
    }
    // Merge the clocks from received ops into local clock
    const merged: Record<string, number> = { ...clock }
    for (const op of remoteOps) {
      const vc = op.vectorClock as Record<string, number>
      for (const [dev, cnt] of Object.entries(vc)) {
        if ((merged[dev] ?? 0) < cnt) merged[dev] = cnt
      }
    }
    await LocalClockService.mergeClock(listId, merged)
  } catch (e) {
    console.warn('[SyncQueue] Failed to pull remote ops for list', listId, e)
  }
}

async function flushQueue(): Promise<string[]> {
  if (flushInProgress) return []
  flushInProgress = true

  try {
    const pending = await OperationQueue.getAllPending()
    if (pending.length === 0) return []

    // Group by listId so we can send one batch per list
    const byList = pending.reduce<Record<string, CrdtOperation[]>>((acc, op) => {
      if (!acc[op.listId]) acc[op.listId] = []
      acc[op.listId]!.push(op)
      return acc
    }, {})

    const synced: string[] = []
    const flushedLists: string[] = []

    const myDeviceId = await getDeviceId()
    const itemsStore = useItemsStore()

    for (const [listId, ops] of Object.entries(byList)) {
      try {
        await api.post(`/lists/${listId}/crdt/ops`, ops)
        synced.push(...ops.map(o => o.id))
        flushedLists.push(listId)

        // Pull ops from other devices that arrived while we were offline
        await pullRemoteOps(listId, myDeviceId, itemsStore)
      } catch (e) {
        // Leave failed ops in queue — will retry next reconnect
        console.warn('[SyncQueue] Failed to flush ops for list', listId, e)
      }
    }

    if (synced.length > 0) {
      await OperationQueue.markAllSynced(synced)
      await OperationQueue.pruneOld()
    }

    return flushedLists
  } finally {
    flushInProgress = false
  }
}
