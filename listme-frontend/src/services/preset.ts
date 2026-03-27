import api from './api'

export interface Preset {
  id: string
  name: string
  emoji: string
  itemCount: number
  system: boolean
  createdAt: string
}

export interface PresetItem {
  id: string
  name: string
  quantity: number | null
  quantityUnit: string | null
  price: number | null
  imageUrl: string | null
}

export const presetService = {
  getAll: (): Promise<Preset[]> =>
    api.get<Preset[]>('/presets').then(r => r.data),

  getItems: (presetId: string): Promise<PresetItem[]> =>
    api.get<PresetItem[]>(`/presets/${presetId}/items`).then(r => r.data),

  create: (name: string, emoji: string, fromListId: string): Promise<Preset> =>
    api.post<Preset>('/presets', { name, emoji, fromListId }).then(r => r.data),

  delete: (presetId: string): Promise<void> =>
    api.delete(`/presets/${presetId}`).then(() => {}),
}
