import { cacheDb } from './db'
import type { ShoppingList, Item } from '../types'

/**
 * Write-through cache backed by IndexedDB.
 * Lists and items are saved here after every successful API response.
 * On network failure, stores fall back to this cache so the app still loads.
 */
export const CacheService = {
  // ── Lists ──────────────────────────────────────────────────────────────

  async saveLists(lists: ShoppingList[]): Promise<void> {
    const now = Date.now()
    await cacheDb.lists.bulkPut(lists.map(l => ({ ...l, _savedAt: now })))
  },

  async saveList(list: ShoppingList): Promise<void> {
    await cacheDb.lists.put({ ...list, _savedAt: Date.now() })
  },

  async getLists(): Promise<ShoppingList[]> {
    const rows = await cacheDb.lists.orderBy('_savedAt').reverse().toArray()
    return rows.map(({ _savedAt, ...list }) => list as ShoppingList)
  },

  async removeList(listId: string): Promise<void> {
    await cacheDb.lists.delete(listId)
    await cacheDb.items.where('listId').equals(listId).delete()
  },

  // ── Items ──────────────────────────────────────────────────────────────

  async saveItems(listId: string, items: Item[]): Promise<void> {
    const now = Date.now()
    // Replace entire list snapshot
    await cacheDb.items.where('listId').equals(listId).delete()
    if (items.length > 0) {
      await cacheDb.items.bulkPut(items.map(i => ({ ...i, _savedAt: now })))
    }
  },

  async saveItem(item: Item): Promise<void> {
    await cacheDb.items.put({ ...item, _savedAt: Date.now() })
  },

  async getItems(listId: string): Promise<Item[]> {
    const rows = await cacheDb.items.where('listId').equals(listId).toArray()
    // Restore position order
    rows.sort((a, b) => a.position - b.position)
    return rows.map(({ _savedAt, ...item }) => item as Item)
  },

  async removeItem(itemId: string): Promise<void> {
    await cacheDb.items.delete(itemId)
  },

  /** Update a single field in a cached item without a full save */
  async patchItem(itemId: string, changes: Partial<Item>): Promise<void> {
    await cacheDb.items.update(itemId, changes)
  },
}
