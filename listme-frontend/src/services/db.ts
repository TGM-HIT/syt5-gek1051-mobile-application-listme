import Dexie, { type Table } from 'dexie'
import type { ShoppingList, Item } from '../types'

export interface CachedList extends ShoppingList {
  _savedAt: number
}

export interface CachedItem extends Item {
  _savedAt: number
}

export interface LocalClock {
  listId: string
  deviceId: string
  counter: number
}

class ListMeCacheDb extends Dexie {
  lists!: Table<CachedList, string>
  items!: Table<CachedItem, string>
  localClocks!: Table<LocalClock, [string, string]>

  constructor() {
    super('listme-cache')
    this.version(1).stores({
      lists: 'id, _savedAt',
      items: 'id, listId, _savedAt',
    })
    this.version(2).stores({
      lists: 'id, _savedAt',
      items: 'id, listId, _savedAt',
      localClocks: '[listId+deviceId]',
    })
  }
}

export const cacheDb = new ListMeCacheDb()
