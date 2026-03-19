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

export interface PendingList {
  tempId: string
  name: string
  emoji: string
  createdAt: number
}

class ListMeCacheDb extends Dexie {
  lists!: Table<CachedList, string>
  items!: Table<CachedItem, string>
  localClocks!: Table<LocalClock, [string, string]>
  pendingLists!: Table<PendingList, string>

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
    this.version(3).stores({
      lists: 'id, _savedAt',
      items: 'id, listId, _savedAt',
      localClocks: '[listId+deviceId]',
      pendingLists: 'tempId',
    })
  }
}

export const cacheDb = new ListMeCacheDb()
