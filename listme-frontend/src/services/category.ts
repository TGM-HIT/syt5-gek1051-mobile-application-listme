import api from './api'
import type { Category, CreateCategoryRequest } from '../types'

export const categoryService = {
  getAll(listId: string): Promise<Category[]> {
    return api.get<Category[]>(`/lists/${listId}/categories`).then(r => r.data)
  },

  create(listId: string, req: CreateCategoryRequest): Promise<Category> {
    return api.post<Category>(`/lists/${listId}/categories`, req).then(r => r.data)
  },

  update(listId: string, categoryId: string, req: CreateCategoryRequest): Promise<Category> {
    return api.put<Category>(`/lists/${listId}/categories/${categoryId}`, req).then(r => r.data)
  },

  delete(listId: string, categoryId: string): Promise<void> {
    return api.delete(`/lists/${listId}/categories/${categoryId}`).then(() => undefined)
  },
}
