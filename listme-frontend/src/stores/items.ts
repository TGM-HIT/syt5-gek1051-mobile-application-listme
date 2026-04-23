import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { itemService } from '../services/item'
import { CacheService } from '../services/cache'
import { LocalClockService } from '../services/clock'
import { OperationQueue } from '../crdt/OperationQueue'
import { getDeviceId } from '../services/device'
import { useListsStore } from './lists'
import type { Item, CreateItemRequest, UpdateItemRequest } from '../types'

class OfflineError extends Error {}

function isNetworkError(e: unknown): boolean {
  if (e instanceof OfflineError) return true
  if (!axios.isAxiosError(e)) return false
  if (!e.response) return true
  const { status } = e.response
  return status === 502 || status === 503 || status === 504
}

export const useItemsStore = defineStore('items', () => {
  // Items keyed by listId for multi-list caching
  const itemsByList = ref<Record<string, Item[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getItems(listId: string): Item[] {
    return itemsByList.value[listId] ?? []
  }

  async function fetchAll(listId: string) {
    loading.value = true
    error.value = null

    // Serve cached items immediately so the list feels instant
    const cached = await CacheService.getItems(listId)
    if (cached.length > 0) {
      itemsByList.value[listId] = cached
      loading.value = false
    }

    try {
      const fresh = await itemService.getAll(listId)

      // Merge: preserve local state for items that have pending offline ops
      const pending = await OperationQueue.getPending(listId)
      const pendingItemIds = new Set(
        pending
          .filter(op => op.operationType !== 'ITEM_DELETE')
          .map(op => op.payload['itemId'] as string)
          .filter(Boolean)
      )
      const deletedItemIds = new Set(
        pending
          .filter(op => op.operationType === 'ITEM_DELETE')
          .map(op => op.payload['itemId'] as string)
          .filter(Boolean)
      )
      const current = itemsByList.value[listId] ?? []
      const merged = [
        ...fresh
          .filter(f => !deletedItemIds.has(f.id))
          .map(f => pendingItemIds.has(f.id) ? (current.find(c => c.id === f.id) ?? f) : f),
        ...current.filter(c => pendingItemIds.has(c.id) && !fresh.some(f => f.id === c.id)),
      ]
      itemsByList.value[listId] = merged
      await CacheService.saveItems(listId, merged)
    } catch {
      if ((itemsByList.value[listId] ?? []).length === 0) {
        error.value = 'Items konnten nicht geladen werden'
      }
      // Silently stay on cached data when offline
    } finally {
      loading.value = false
    }
  }

  async function create(listId: string, req: CreateItemRequest): Promise<Item> {
    try {
      if (!navigator.onLine) throw new OfflineError()
      const item = await itemService.create(listId, req)
      if (!itemsByList.value[listId]) itemsByList.value[listId] = []
      itemsByList.value[listId].push(item)
      await CacheService.saveItem(item)
      syncCounts(listId)
      return item
    } catch (e) {
      if (!isNetworkError(e)) throw e

      // Offline: apply locally with a client-generated UUID, queue for later sync
      const deviceId = await getDeviceId()
      const itemId = crypto.randomUUID()
      const now = new Date().toISOString()
      const item: Item = {
        id: itemId,
        listId,
        name: req.name,
        checked: false,
        position: (itemsByList.value[listId] ?? []).length,
        categoryId: req.categoryId ?? null,
        categoryName: null,
        categoryColor: null,
        quantity: req.quantity ?? null,
        quantityUnit: req.quantityUnit ?? null,
        price: req.price ?? null,
        imageUrl: req.imageUrl ?? null,
        labels: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        createdByDeviceId: null,
      }
      if (!itemsByList.value[listId]) itemsByList.value[listId] = []
      itemsByList.value[listId].push(item)
      await CacheService.saveItem(item)
      syncCounts(listId)

      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_CREATE',
        payload: {
          itemId,
          name: req.name,
          position: item.position,
          quantity: req.quantity ?? null,
          quantityUnit: req.quantityUnit ?? null,
          price: req.price ?? null,
          imageUrl: req.imageUrl ?? null,
          timestamp: Date.now(),
        },
        vectorClock,
        createdAt: Date.now(),
      })
      return item
    }
  }

  async function update(listId: string, itemId: string, req: UpdateItemRequest): Promise<void> {
    try {
      if (!navigator.onLine) throw new OfflineError()
      const updated = await itemService.update(listId, itemId, req)
      const items = itemsByList.value[listId] ?? []
      const idx = items.findIndex(i => i.id === itemId)
      if (idx !== -1) items[idx] = updated
      await CacheService.saveItem(updated)
    } catch (e) {
      if (!isNetworkError(e)) throw e

      const items = itemsByList.value[listId] ?? []
      const idx = items.findIndex(i => i.id === itemId)
      if (idx === -1) return
      const patched = {
        ...items[idx]!,
        name: req.name,
        quantity: req.quantity ?? null,
        quantityUnit: req.quantityUnit ?? null,
        price: req.price ?? null,
        imageUrl: req.imageUrl ?? null,
        updatedAt: new Date().toISOString(),
      }
      items[idx] = patched
      await CacheService.saveItem(patched)

      const deviceId = await getDeviceId()
      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_UPDATE',
        payload: {
          itemId,
          name: req.name,
          quantity: req.quantity ?? null,
          quantityUnit: req.quantityUnit ?? null,
          price: req.price ?? null,
          imageUrl: req.imageUrl ?? null,
          timestamp: Date.now(),
        },
        vectorClock,
        createdAt: Date.now(),
      })
    }
  }

  async function toggleCheck(listId: string, itemId: string): Promise<void> {
    try {
      if (!navigator.onLine) throw new OfflineError()
      const updated = await itemService.toggleCheck(listId, itemId)
      const items = itemsByList.value[listId] ?? []
      const idx = items.findIndex(i => i.id === itemId)
      if (idx !== -1) items[idx] = updated
      await CacheService.saveItem(updated)
      syncCounts(listId)
    } catch (e) {
      if (!isNetworkError(e)) throw e

      const items = itemsByList.value[listId] ?? []
      const idx = items.findIndex(i => i.id === itemId)
      if (idx === -1) return
      const toggled = { ...items[idx]!, checked: !items[idx]!.checked }
      items[idx] = toggled
      await CacheService.saveItem(toggled)
      syncCounts(listId)

      const deviceId = await getDeviceId()
      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_CHECK',
        payload: { itemId, checked: toggled.checked, timestamp: Date.now() },
        vectorClock,
        createdAt: Date.now(),
      })
    }
  }

  async function remove(listId: string, itemId: string): Promise<void> {
    try {
      if (!navigator.onLine) throw new OfflineError()
      await itemService.delete(listId, itemId)
      if (itemsByList.value[listId]) {
        itemsByList.value[listId] = itemsByList.value[listId].filter(i => i.id !== itemId)
      }
      await CacheService.removeItem(itemId)
      syncCounts(listId)
    } catch (e) {
      if (!isNetworkError(e)) throw e

      // Offline: remove locally and queue delete for sync
      if (itemsByList.value[listId]) {
        itemsByList.value[listId] = itemsByList.value[listId].filter(i => i.id !== itemId)
      }
      await CacheService.removeItem(itemId)
      syncCounts(listId)

      const deviceId = await getDeviceId()
      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_DELETE',
        payload: { itemId, timestamp: Date.now() },
        vectorClock,
        createdAt: Date.now(),
      })
    }
  }

  function syncCounts(listId: string) {
    const items = itemsByList.value[listId] ?? []
    useListsStore().patchCounts(listId, items.length, items.filter(i => i.checked).length)
  }

  return { itemsByList, loading, error, getItems, fetchAll, create, update, toggleCheck, remove, syncCounts }
})
