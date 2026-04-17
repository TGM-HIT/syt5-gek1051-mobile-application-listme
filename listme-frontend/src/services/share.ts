import api from './api'
import type { ShoppingList, ShareTokenResponse, SyncTokenResponse, SyncPreviewResponse, SyncApplyResponse, ParticipantResponse } from '../types'

export const shareService = {
  generateToken(listId: string): Promise<ShareTokenResponse> {
    return api.post<ShareTokenResponse>(`/lists/${listId}/share`).then(r => r.data)
  },

  revokeToken(listId: string): Promise<void> {
    return api.delete(`/lists/${listId}/share`).then(() => undefined)
  },

  previewToken(token: string): Promise<ShoppingList> {
    return api.get<ShoppingList>(`/share/${token}`).then(r => r.data)
  },

  joinViaToken(token: string): Promise<ShoppingList> {
    return api.post<ShoppingList>(`/share/${token}/join`).then(r => r.data)
  },

  createSyncToken(theme: string): Promise<SyncTokenResponse> {
    return api.post<SyncTokenResponse>('/sync', { theme }).then(r => r.data)
  },

  previewSyncToken(token: string): Promise<SyncPreviewResponse> {
    return api.get<SyncPreviewResponse>(`/sync/${token}`).then(r => r.data)
  },

  applySyncToken(token: string): Promise<SyncApplyResponse> {
    return api.post<SyncApplyResponse>(`/sync/${token}/apply`).then(r => r.data)
  },

  getParticipants(listId: string): Promise<ParticipantResponse[]> {
    return api.get<ParticipantResponse[]>(`/lists/${listId}/participants`).then(r => r.data)
  },
}
