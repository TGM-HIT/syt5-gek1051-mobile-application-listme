import api from './api'
import type { ShoppingList, CreateListRequest, UpdateListRequest } from '../types'

export const listService = {
  getAll(): Promise<ShoppingList[]> {
    return api.get<ShoppingList[]>('/lists').then(r => r.data)
  },

  getOne(listId: string): Promise<ShoppingList> {
    return api.get<ShoppingList>(`/lists/${listId}`).then(r => r.data)
  },

  create(req: CreateListRequest): Promise<ShoppingList> {
    return api.post<ShoppingList>('/lists', req).then(r => r.data)
  },

  update(listId: string, req: UpdateListRequest): Promise<ShoppingList> {
    return api.put<ShoppingList>(`/lists/${listId}`, req).then(r => r.data)
  },

  delete(listId: string): Promise<void> {
    return api.delete(`/lists/${listId}`).then(() => undefined)
  },

  duplicate(listId: string): Promise<ShoppingList> {
    return api.post<ShoppingList>(`/lists/${listId}/duplicate`).then(r => r.data)
  },
}
