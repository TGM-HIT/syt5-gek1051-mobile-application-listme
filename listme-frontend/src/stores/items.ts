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

function isNetworkError(e: unknown): boolean {
  return axios.isAxiosError(e) && !e.response
}

export const useItemsStore = defineStore('items', () => {
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

    // Don't overwrite local optimistic state if ops are queued for this list.
    // The correct server state will arrive after flushQueue → fetchAll.
    const pendingOps = await OperationQueue.getAllPending()
    if (pendingOps.some(op => op.listId === listId)) {
      loading.value = false
      return
    }

    try {
      const fresh = await itemService.getAll(listId)
      itemsByList.value[listId] = fresh
      await CacheService.saveItems(listId, fresh)
    } catch {
      if ((itemsByList.value[listId] ?? []).length === 0) {
        error.value = 'Items konnten nicht geladen werden'
      }
    } finally {
      loading.value = false
    }
  }

  async function create(listId: string, req: CreateItemRequest): Promise<Item> {
    // Optimistic item shown immediately with a client-generated UUID
    const deviceId = await getDeviceId()
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const optimistic: Item = {
      id: tempId,
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
    itemsByList.value[listId].push(optimistic)
    await CacheService.saveItem(optimistic)
    syncCounts(listId)

    try {
      const item = await itemService.create(listId, req)
      // Replace temp item with server-confirmed item
      const items = itemsByList.value[listId] ?? []
      const idx = items.findIndex(i => i.id === tempId)
      if (idx !== -1) items[idx] = item
      else items.push(item)
      await CacheService.removeItem(tempId)
      await CacheService.saveItem(item)
      syncCounts(listId)
      return item
    } catch (e) {
      if (!isNetworkError(e)) {
        // Undo optimistic add on non-network error
        itemsByList.value[listId] = (itemsByList.value[listId] ?? []).filter(i => i.id !== tempId)
        await CacheService.removeItem(tempId)
        syncCounts(listId)
        throw e
      }
      // Network error: keep optimistic item, queue CRDT op for later sync
      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_CREATE',
        payload: { itemId: tempId, name: req.name, position: optimistic.position, timestamp: Date.now() },
        vectorClock,
        createdAt: Date.now(),
      })
      return optimistic
    }
  }

  async function update(listId: string, itemId: string, req: UpdateItemRequest): Promise<void> {
    const items = itemsByList.value[listId] ?? []
    const idx = items.findIndex(i => i.id === itemId)
    if (idx === -1) return

    // Apply optimistically
    const original = items[idx]!
    const patched = {
      ...original,
      name: req.name,
      quantity: req.quantity ?? null,
      quantityUnit: req.quantityUnit ?? null,
      price: req.price ?? null,
      imageUrl: req.imageUrl ?? null,
      updatedAt: new Date().toISOString(),
    }
    items[idx] = patched
    await CacheService.saveItem(patched)

    try {
      const updated = await itemService.update(listId, itemId, req)
      items[idx] = updated
      await CacheService.saveItem(updated)
    } catch (e) {
      if (!isNetworkError(e)) {
        items[idx] = original
        await CacheService.saveItem(original)
        throw e
      }
      const deviceId = await getDeviceId()
      const vectorClock = await LocalClockService.getNextClock(listId, deviceId)
      await OperationQueue.enqueue({
        id: crypto.randomUUID(),
        listId,
        deviceId,
        operationType: 'ITEM_UPDATE',
        payload: { itemId, name: req.name, timestamp: Date.now() },
        vectorClock,
        createdAt: Date.now(),
      })
    }
  }

  async function toggleCheck(listId: string, itemId: string): Promise<void> {
    const items = itemsByList.value[listId] ?? []
    const idx = items.findIndex(i => i.id === itemId)
    if (idx === -1) return

    // Apply optimistically — UI responds instantly even when offline
    const original = items[idx]!
    const toggled = { ...original, checked: !original.checked }
    items[idx] = toggled
    await CacheService.saveItem(toggled)
    syncCounts(listId)

    try {
      const updated = await itemService.toggleCheck(listId, itemId)
      items[idx] = updated
      await CacheService.saveItem(updated)
      syncCounts(listId)
    } catch (e) {
      if (!isNetworkError(e)) {
        // Undo on non-network error
        items[idx] = original
        await CacheService.saveItem(original)
        syncCounts(listId)
        throw e
      }
      // Network error: optimistic state is already correct, queue CRDT op
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
    const items = itemsByList.value[listId] ?? []
    const removed = items.find(i => i.id === itemId)
    if (!removed) return

    // Apply optimistically
    itemsByList.value[listId] = items.filter(i => i.id !== itemId)
    await CacheService.removeItem(itemId)
    syncCounts(listId)

    try {
      await itemService.delete(listId, itemId)
    } catch (e) {
      if (!isNetworkError(e)) {
        // Undo: put the item back
        itemsByList.value[listId] = [...(itemsByList.value[listId] ?? []), removed]
        await CacheService.saveItem(removed)
        syncCounts(listId)
        throw e
      }
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

  return { itemsByList, loading, error, getItems, fetchAll, create, update, toggleCheck, remove }
})
