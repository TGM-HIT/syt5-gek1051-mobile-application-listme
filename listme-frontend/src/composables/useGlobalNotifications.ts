import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { onAnyConnect, subscribe, isConnected } from '../services/websocket'
import { useItemsStore } from '../stores/items'
import { useListsStore } from '../stores/lists'
import { useNotificationsStore } from '../stores/notifications'
import { getDeviceId } from '../services/device'
import { applyOp, opToMessage } from './useListSync'
import type { CrdtOperation } from '../crdt/types'

/**
 * Subscribes to every list the user has access to, except the list currently
 * open in ListDetailView (which useListSync already handles). Shows a
 * notification toast for every incoming op from another device.
 *
 * Call once from App.vue so it stays alive for the whole session.
 */
export function useGlobalNotifications() {
  const route = useRoute()
  const listsStore = useListsStore()
  const notificationsStore = useNotificationsStore()
  let myDeviceId: string | null = null
  const subs: Array<() => void> = []

  function resubscribe() {
    subs.forEach(fn => fn())
    subs.length = 0
    if (!isConnected()) return

    // ListDetailView exposes the active list via route.params.id — skip it to
    // avoid double-notifications (useListSync already handles that list).
    const activeListId = (route.params?.id as string) || null
    const itemsStore = useItemsStore()

    for (const list of listsStore.lists) {
      if (list.id === activeListId) continue

      const listId = list.id
      const unsub = subscribe(`/topic/list/${listId}`, (payload) => {
        const op = payload as CrdtOperation
        if (op.deviceId === myDeviceId) return
        applyOp(listId, op, itemsStore)
        const listName = listsStore.getById(listId)?.name ?? ''
        notificationsStore.add({ listId, listName, message: opToMessage(op) })
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
      })
      subs.push(unsub)
    }
  }

  // Re-subscribe when the user navigates into or out of a list view
  watch(() => route.params?.id, resubscribe)

  // Re-subscribe when the list roster changes (new list joined/created)
  watch(() => listsStore.lists.map(l => l.id).join(','), resubscribe)

  // Re-subscribe on every WebSocket (re)connect
  onAnyConnect(async () => {
    if (!myDeviceId) myDeviceId = await getDeviceId()
    resubscribe()
  })
}
