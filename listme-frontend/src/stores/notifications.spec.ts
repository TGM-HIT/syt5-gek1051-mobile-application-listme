import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from './notifications'

describe('useNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
  })

  it('starts with empty notifications', () => {
    const store = useNotificationsStore()
    expect(store.notifications).toHaveLength(0)
  })

  it('add() appends a notification with generated id and ts', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'Groceries', count: 1 })
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0]!.id).toBe('test-uuid')
    expect(store.notifications[0]!.listId).toBe('l1')
    expect(store.notifications[0]!.listName).toBe('Groceries')
    expect(store.notifications[0]!.count).toBe(1)
    expect(typeof store.notifications[0]!.ts).toBe('number')
  })

  it('add() can append multiple notifications', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    store.add({ listId: 'l2', listName: 'B', count: 2 })
    expect(store.notifications).toHaveLength(2)
  })

  it('dismiss() removes the notification with the given id', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    const id = store.notifications[0]!.id
    store.dismiss(id)
    expect(store.notifications).toHaveLength(0)
  })

  it('dismiss() leaves other notifications intact', () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValueOnce('id-1').mockReturnValueOnce('id-2'),
    })
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    store.add({ listId: 'l2', listName: 'B', count: 1 })
    store.dismiss('id-1')
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0]!.id).toBe('id-2')
  })

  it('dismiss() with unknown id does nothing', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    store.dismiss('nonexistent')
    expect(store.notifications).toHaveLength(1)
  })

  it('dismissAll() clears all notifications', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    store.add({ listId: 'l2', listName: 'B', count: 2 })
    store.dismissAll()
    expect(store.notifications).toHaveLength(0)
  })

  it('dismissAll() on empty store does not throw', () => {
    const store = useNotificationsStore()
    expect(() => store.dismissAll()).not.toThrow()
  })
})
