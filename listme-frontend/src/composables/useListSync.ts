import { ref, onUnmounted } from 'vue'
import { connectWebSocket, subscribe, send, onReconnect, wsConnected } from '../services/websocket'
import { useItemsStore } from '../stores/items'
import { usePresenceStore } from '../stores/presence'
import { getDeviceId } from '../services/device'
import { detectConflicts } from '../crdt/ConflictDetector'
import type { Conflict } from '../crdt/ConflictDetector'
import type { CrdtOperation } from '../crdt/types'
import type { Item } from '../types'

/**
 * Composable that manages real-time sync for a single list view.
 *
 * Call `startSync(listId)` when the list detail view mounts.
 * All incoming CRDT ops from other devices are applied to the Pinia store.
 * Presence join/leave events are tracked in the presence store.
 */
export function useListSync() {
  const conflicts = ref<Conflict[]>([])
  const topicUnsubs: Array<() => void> = []
  let currentListId: string | null = null
  const sessionOps: CrdtOperation[] = []
  let unregisterReconnect: (() => void) | null = null

  async function startSync(listId: string) {
    currentListId = listId

    try {
      await connectWebSocket()
    } catch (e) {
      console.warn('[Sync] WebSocket unavailable, running offline', e)
      return
    }

    const itemsStore = useItemsStore()
    const presenceStore = usePresenceStore()
    const myDeviceId = await getDeviceId()

    function subscribeToTopics() {
      // Clean up any stale subscriptions from the previous session
      topicUnsubs.forEach(fn => fn())
      topicUnsubs.length = 0

      const unsubOps = subscribe(`/topic/list/${listId}`, (payload) => {
        const op = payload as CrdtOperation
        // Skip ops originating from this device — already applied locally via HTTP response
        if (op.deviceId === myDeviceId) return
        sessionOps.push(op)
        conflicts.value = detectConflicts(sessionOps)
        applyOp(listId, op, itemsStore)
      })

      const unsubPresence = subscribe(`/topic/list/${listId}/presence`, (payload) => {
        const msg = payload as { event: string; deviceId: string; onlineDevices: string[] }
        if (msg.event === 'snapshot') presenceStore.setSnapshot(listId, msg.onlineDevices)
        else if (msg.event === 'joined') presenceStore.addDevice(listId, msg.deviceId)
        else if (msg.event === 'left') presenceStore.removeDevice(listId, msg.deviceId)
      })

      topicUnsubs.push(unsubOps, unsubPresence)

      // Announce presence (also re-announces on reconnect so server tracks us again)
      send(`/app/list/${listId}/join`)
    }

    subscribeToTopics()

    // Re-subscribe every time the WebSocket reconnects — each reconnect is a new
    // STOMP session so previous subscriptions are gone.
    unregisterReconnect = onReconnect(() => {
      console.debug('[Sync] reconnected, re-subscribing to list', listId)
      subscribeToTopics()
    })
  }

  function stopSync() {
    if (currentListId) send(`/app/list/${currentListId}/leave`)
    topicUnsubs.forEach(fn => fn())
    topicUnsubs.length = 0
    unregisterReconnect?.()
    unregisterReconnect = null
    currentListId = null
    sessionOps.length = 0
    conflicts.value = []
  }

  function dismissConflicts() {
    conflicts.value = []
  }

  onUnmounted(stopSync)

  return { connected: wsConnected, conflicts, dismissConflicts, startSync, stopSync }
}

/**
 * Apply an incoming CRDT operation from another device to the local Pinia state.
 * This is optimistic — we trust the server has already applied it to the DB.
 */
function applyOp(listId: string, op: CrdtOperation, itemsStore: ReturnType<typeof useItemsStore>) {
  const payload = op.payload
  const items = itemsStore.getItems(listId)

  switch (op.operationType) {
    case 'ITEM_CREATE': {
      const itemId = payload['itemId'] as string
      const already = items.find(i => i.id === itemId)
      if (already) return
      const newItem: Item = {
        id: itemId,
        listId,
        name: payload['name'] as string,
        checked: false,
        position: payload['position'] as number ?? items.length,
        categoryId: null,
        categoryName: null,
        categoryColor: null,
        quantity: null,
        quantityUnit: null,
        price: null,
        imageUrl: null,
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        createdByDeviceId: null,
      }
      itemsStore.itemsByList[listId] = [...items, newItem]
      break
    }
    case 'ITEM_CHECK': {
      const itemId = payload['itemId'] as string
      const checked = payload['checked'] as boolean
      const idx = items.findIndex(i => i.id === itemId)
      if (idx !== -1) items[idx] = { ...items[idx]!, checked }
      break
    }
    case 'ITEM_UPDATE': {
      const itemId = payload['itemId'] as string
      const name = payload['name'] as string
      const idx = items.findIndex(i => i.id === itemId)
      if (idx !== -1) items[idx] = { ...items[idx]!, name }
      break
    }
    case 'ITEM_DELETE': {
      const itemId = payload['itemId'] as string
      if (itemsStore.itemsByList[listId]) {
        itemsStore.itemsByList[listId] = items.filter(i => i.id !== itemId)
      }
      break
    }
  }
}
