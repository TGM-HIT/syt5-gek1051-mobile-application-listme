import { ref, onUnmounted } from 'vue'
import { connectWebSocket, subscribe, send, isConnected } from '../services/websocket'
import { useItemsStore } from '../stores/items'
import { usePresenceStore } from '../stores/presence'
import { useNotificationsStore } from '../stores/notifications'
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
  const connected = ref(false)
  const conflicts = ref<Conflict[]>([])
  const unsubscribers: Array<() => void> = []
  let currentListId: string | null = null
  const sessionOps: CrdtOperation[] = []

  async function startSync(listId: string) {
    currentListId = listId

    try {
      await connectWebSocket()
      connected.value = isConnected()
    } catch (e) {
      console.warn('[Sync] WebSocket unavailable, running offline', e)
      return
    }

    const itemsStore = useItemsStore()
    const presenceStore = usePresenceStore()
    const notificationsStore = useNotificationsStore()
    const myDeviceId = await getDeviceId()

    // Subscribe to CRDT operation stream
    const unsubOps = subscribe(`/topic/list/${listId}`, (payload) => {
      const op = payload as CrdtOperation
      // Skip ops originating from this device — already applied locally via HTTP response
      if (op.deviceId === myDeviceId) return
      sessionOps.push(op)
      const newConflicts = detectConflicts(sessionOps)
      const hadConflicts = conflicts.value.length
      conflicts.value = newConflicts
      // If new conflicts appeared, also notify the global store (for when list isn't focused)
      if (newConflicts.length > hadConflicts) {
        notificationsStore.add({
          listId,
          listName: '', // name not available here; toast will show empty or be skipped
          count: newConflicts.length - hadConflicts,
        })
      }
      applyOp(listId, op, itemsStore)
    })

    // Subscribe to presence events
    const unsubPresence = subscribe(`/topic/list/${listId}/presence`, (payload) => {
      const msg = payload as { event: string; deviceId: string; onlineDevices: string[] }
      if (msg.event === 'snapshot') presenceStore.setSnapshot(listId, msg.onlineDevices)
      else if (msg.event === 'joined') presenceStore.addDevice(listId, msg.deviceId)
      else if (msg.event === 'left') presenceStore.removeDevice(listId, msg.deviceId)
    })

    unsubscribers.push(unsubOps, unsubPresence)

    // Announce presence
    send(`/app/list/${listId}/join`)
  }

  function stopSync() {
    if (currentListId) send(`/app/list/${currentListId}/leave`)
    unsubscribers.forEach(fn => fn())
    unsubscribers.length = 0
    currentListId = null
    sessionOps.length = 0
    conflicts.value = []
  }

  function dismissConflicts() {
    conflicts.value = []
  }

  onUnmounted(stopSync)

  return { connected, conflicts, dismissConflicts, startSync, stopSync }
}

/**
 * Apply an incoming CRDT operation from another device to the local Pinia state.
 * This is optimistic — we trust the server has already applied it to the DB.
 * Exported so useSyncQueue can reuse the same logic during pull-on-reconnect.
 */
export function applyOp(listId: string, op: CrdtOperation, itemsStore: ReturnType<typeof useItemsStore>) {
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
