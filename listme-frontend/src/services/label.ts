import api from './api'
import type { Label, CreateLabelRequest } from '../types'

export const labelService = {
  getAll(listId: string): Promise<Label[]> {
    return api.get<Label[]>(`/lists/${listId}/labels`).then(r => r.data)
  },

  create(listId: string, req: CreateLabelRequest): Promise<Label> {
    return api.post<Label>(`/lists/${listId}/labels`, req).then(r => r.data)
  },

  update(listId: string, labelId: string, req: CreateLabelRequest): Promise<Label> {
    return api.put<Label>(`/lists/${listId}/labels/${labelId}`, req).then(r => r.data)
  },

  delete(listId: string, labelId: string): Promise<void> {
    return api.delete(`/lists/${listId}/labels/${labelId}`).then(() => undefined)
  },
}
