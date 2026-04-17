import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ConflictNotification {
  id: string
  listId: string
  listName: string
  count: number
  ts: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<ConflictNotification[]>([])

  function add(n: Omit<ConflictNotification, 'id' | 'ts'>) {
    notifications.value.push({
      ...n,
      id: crypto.randomUUID(),
      ts: Date.now(),
    })
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function dismissAll() {
    notifications.value = []
  }

  return { notifications, add, dismiss, dismissAll }
})
