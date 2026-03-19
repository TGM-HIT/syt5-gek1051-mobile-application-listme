import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { listService } from '../services/list'
import { CacheService } from '../services/cache'
import { cacheDb } from '../services/db'
import type { ShoppingList, CreateListRequest, UpdateListRequest } from '../types'

function isNetworkError(e: unknown): boolean {
  return axios.isAxiosError(e) && !e.response
}

export const useListsStore = defineStore('lists', () => {
    const lists = ref<ShoppingList[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchAll() {
        loading.value = true
        error.value = null

        // Serve cached data immediately so the UI is never blank
        const cached = await CacheService.getLists()
        if (cached.length > 0) {
            lists.value = cached
            loading.value = false // stop skeleton once cache is ready
        }

        try {
            const fresh = await listService.getAll()
            lists.value = fresh
            await CacheService.saveLists(fresh)
        } catch {
            if (lists.value.length === 0) {
                error.value = 'Listen konnten nicht geladen werden'
            }
            // Silently stay on cached data when offline
        } finally {
            loading.value = false
        }
    }

    async function create(req: CreateListRequest): Promise<ShoppingList> {
        try {
            const list = await listService.create(req)
            lists.value.unshift(list)
            await CacheService.saveList(list)
            return list
        } catch (e) {
            if (!isNetworkError(e)) throw e

            // Offline: create locally with a client-generated UUID, queue for sync on reconnect
            const tempId = crypto.randomUUID()
            const now = new Date().toISOString()
            const list: ShoppingList = {
                id: tempId,
                name: req.name,
                emoji: req.emoji ?? '🛒',
                shareToken: null,
                itemCount: 0,
                checkedCount: 0,
                participantCount: 1,
                createdAt: now,
                updatedAt: now,
            }
            lists.value.unshift(list)
            await CacheService.saveList(list)
            await cacheDb.pendingLists.put({ tempId, name: req.name, emoji: list.emoji, createdAt: Date.now() })
            return list
        }
    }

    async function update(listId: string, req: UpdateListRequest): Promise<void> {
        const updated = await listService.update(listId, req)
        const idx = lists.value.findIndex(l => l.id === listId)
        if (idx !== -1) lists.value[idx] = updated
        await CacheService.saveList(updated)
    }

    async function remove(listId: string): Promise<void> {
        await listService.delete(listId)
        lists.value = lists.value.filter(l => l.id !== listId)
        await CacheService.removeList(listId)
    }

    function getById(listId: string): ShoppingList | undefined {
        return lists.value.find(l => l.id === listId)
    }

    function patchCounts(listId: string, itemCount: number, checkedCount: number) {
        const list = lists.value.find(l => l.id === listId)
        if (list) {
            list.itemCount = itemCount
            list.checkedCount = checkedCount
            CacheService.saveList(list)
        }
    }

    async function duplicate(listId: string): Promise<ShoppingList> {
        const copy = await listService.duplicate(listId)
        lists.value.push(copy)
        await CacheService.saveList(copy)
        return copy
    }

    return { lists, loading, error, fetchAll, create, update, remove, getById, patchCounts, duplicate }
})
