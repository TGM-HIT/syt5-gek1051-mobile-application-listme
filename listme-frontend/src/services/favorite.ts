import api from './api'
import type { Favorite, CreateFavoriteRequest } from '../types'

export const favoriteService = {
  getAll(): Promise<Favorite[]> {
    return api.get<Favorite[]>('/favorites').then(r => r.data)
  },

  create(req: CreateFavoriteRequest): Promise<Favorite> {
    return api.post<Favorite>('/favorites', req).then(r => r.data)
  },

  delete(favoriteId: string): Promise<void> {
    return api.delete(`/favorites/${favoriteId}`).then(() => undefined)
  },
}
