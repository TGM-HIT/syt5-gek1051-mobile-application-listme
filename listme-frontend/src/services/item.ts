import api from './api'
import type { Item, CreateItemRequest, UpdateItemRequest } from '../types'

export const itemService = {
  getAll(listId: string): Promise<Item[]> {
    return api.get<Item[]>(`/lists/${listId}/items`).then(r => r.data)
  },

  getTrash(listId: string): Promise<Item[]> {
    return api.get<Item[]>(`/lists/${listId}/items/trash`).then(r => r.data)
  },

  create(listId: string, req: CreateItemRequest): Promise<Item> {
    return api.post<Item>(`/lists/${listId}/items`, req).then(r => r.data)
  },

  update(listId: string, itemId: string, req: UpdateItemRequest): Promise<Item> {
    return api.put<Item>(`/lists/${listId}/items/${itemId}`, req).then(r => r.data)
  },

  toggleCheck(listId: string, itemId: string): Promise<Item> {
    return api.patch<Item>(`/lists/${listId}/items/${itemId}/check`).then(r => r.data)
  },

  delete(listId: string, itemId: string): Promise<void> {
    return api.delete(`/lists/${listId}/items/${itemId}`).then(() => undefined)
  },

  restore(listId: string, itemId: string): Promise<Item> {
    return api.patch<Item>(`/lists/${listId}/items/${itemId}/restore`).then(r => r.data)
  },

  permanentDelete(listId: string, itemId: string): Promise<void> {
    return api.delete(`/lists/${listId}/items/${itemId}/permanent`).then(() => undefined)
  },
}
