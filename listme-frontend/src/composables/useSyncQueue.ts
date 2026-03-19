import { watch } from 'vue'
import { OperationQueue } from '../crdt/OperationQueue'
import api from '../services/api'
import { useOffline } from './useOffline'
import { useItemsStore } from '../stores/items'
import { onReconnect } from '../services/websocket'
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
  const itemsStore = useItemsStore()

  // Flush when navigator.onLine recovers (full network loss scenario)
  watch(isOnline, async (online) => {
    if (online) {
      const flushedListIds = await flushQueue()
      // Re-fetch each affected list so local state converges with server
      await Promise.allSettled(flushedListIds.map(id => itemsStore.fetchAll(id)))
    }
  })

  // Also flush when the WebSocket reconnects after a server-side drop
  // (navigator.onLine stays true, but the WS connection was lost temporarily)
  if (!reconnectListenerRegistered) {
    reconnectListenerRegistered = true
    onReconnect(async () => {
      const store = useItemsStore()
      const flushedListIds = await flushQueue()
      await Promise.allSettled(flushedListIds.map(id => store.fetchAll(id)))
    })
  }

  return { flushQueue }
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

    for (const [listId, ops] of Object.entries(byList)) {
      try {
        await api.post(`/lists/${listId}/crdt/ops`, ops)
        synced.push(...ops.map(o => o.id))
        flushedLists.push(listId)
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
