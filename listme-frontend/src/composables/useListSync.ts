import { ref, onUnmounted } from 'vue'
import { connectWebSocket, subscribe, send, isConnected, onAnyConnect } from '../services/websocket'
import { OperationQueue } from '../crdt/OperationQueue'
import { useItemsStore } from '../stores/items'
import { usePresenceStore } from '../stores/presence'
import { useNotificationsStore } from '../stores/notifications'
import { useListsStore } from '../stores/lists'
import { getDeviceId } from '../services/device'
import { LocalClockService } from '../services/clock'
import { detectConflicts } from '../crdt/ConflictDetector'
import type { Conflict } from '../crdt/ConflictDetector'
import type { CrdtOperation } from '../crdt/types'
import type { Item } from '../types'

export function useListSync() {
  const connected = ref(false)
  const conflicts = ref<Conflict[]>([])
  const unsubscribers: Array<() => void> = []
  let currentListId: string | null = null
  const sessionOps: CrdtOperation[] = []

  async function startSync(listId: string) {
    currentListId = listId

    const itemsStore = useItemsStore()
    const listsStore = useListsStore()
    const presenceStore = usePresenceStore()
    const notificationsStore = useNotificationsStore()
    const myDeviceId = await getDeviceId()

    let unsubOps: (() => void) | null = null
    let unsubPresence: (() => void) | null = null

    function subscribeTopics() {
      unsubOps?.()
      unsubPresence?.()

      unsubOps = subscribe(`/topic/list/${listId}`, (payload) => {
        const op = payload as CrdtOperation
        if (op.deviceId === myDeviceId) return

        LocalClockService.mergeClock(listId, op.vectorClock as Record<string, number>)

        sessionOps.push(op)
        conflicts.value = detectConflicts(sessionOps)

        const listName = listsStore.getById(listId)?.name ?? ''
        notificationsStore.add({ listId, listName, message: opToMessage(op) })
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])

        applyOp(listId, op, itemsStore)
      })

      unsubPresence = subscribe(`/topic/list/${listId}/presence`, (payload) => {
        const msg = payload as { event: string; deviceId: string; onlineDevices: string[] }
        if (msg.event === 'snapshot') presenceStore.setSnapshot(listId, msg.onlineDevices)
        else if (msg.event === 'joined') presenceStore.addDevice(listId, msg.deviceId)
        else if (msg.event === 'left') presenceStore.removeDevice(listId, msg.deviceId)
      })

      send(`/app/list/${listId}/join`)
    }

    // Register BEFORE connectWebSocket so this fires even on the very first
    // successful connection (covers devices that were offline at mount time).
    const unsubConnect = onAnyConnect(async () => {
      connected.value = true
      subscribeTopics()

      // Skip fetchAll if there are pending ops for this list — useSyncQueue flushes
      // them first and pulls remote ops via applyOp. Fetching before the flush races
      // and overwrites correct optimistic state with stale pre-flush server data.
      const pending = await OperationQueue.getAllPending()
      if (pending.some(op => op.listId === listId)) return

      const snapIds = new Set(itemsStore.getItems(listId).map(i => `${i.id}|${i.checked}|${i.name}`))
      await itemsStore.fetchAll(listId)
      const after = itemsStore.getItems(listId)
      const changed = after.length !== snapIds.size
        || after.some(i => !snapIds.has(`${i.id}|${i.checked}|${i.name}`))
      if (changed) {
        const listName = listsStore.getById(listId)?.name ?? ''
        notificationsStore.add({ listId, listName, message: 'Liste wurde aktualisiert' })
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
      }
    })

    // Try to connect — if offline the STOMP client retries automatically;
    // onAnyConnect fires once the connection eventually succeeds.
    try {
      await connectWebSocket()
      connected.value = isConnected()
    } catch (e) {
      console.warn('[Sync] WebSocket unavailable, running offline', e)
    }

    function onVisible() {
      if (document.visibilityState === 'visible') itemsStore.fetchAll(listId)
    }
    document.addEventListener('visibilitychange', onVisible)

    unsubscribers.push(() => {
      unsubOps?.()
      unsubPresence?.()
      unsubConnect()
      document.removeEventListener('visibilitychange', onVisible)
    })
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

export function opToMessage(op: CrdtOperation): string {
  const name = op.payload['name'] as string | undefined
  switch (op.operationType) {
    case 'ITEM_CREATE': return name ? `"${name}" hinzugefügt` : 'Artikel hinzugefügt'
    case 'ITEM_CHECK': return op.payload['checked'] ? 'Artikel abgehakt' : 'Artikel reaktiviert'
    case 'ITEM_UPDATE': return name ? `"${name}" bearbeitet` : 'Artikel bearbeitet'
    case 'ITEM_DELETE': return 'Artikel gelöscht'
    default: return 'Änderung eingetroffen'
  }
}

/**
 * Apply an incoming CRDT operation from another device to the local Pinia state.
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
