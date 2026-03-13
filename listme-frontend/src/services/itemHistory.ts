import api from './api'
import { useItemsStore } from '../stores/items'

export interface HistorySuggestion {
  name: string
  quantityUnit: string | null
  price: number | null
  imageUrl: string | null
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function searchHistory(q: string, limit = 8): Promise<HistorySuggestion[]> {
  return new Promise((resolve) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (!q || q.length < 2) { resolve([]); return }
      try {
        const data = await api
          .get<HistorySuggestion[]>('/items/history', { params: { q, limit } })
          .then(r => r.data)
        resolve(data)
      } catch {
        // Offline fallback: scan Pinia store
        const itemsStore = useItemsStore()
        const lower = q.toLowerCase()
        const seen = new Map<string, HistorySuggestion>()
        for (const item of Object.values(itemsStore.itemsByList).flat()) {
          const n = item.name.trim().toLowerCase()
          if (!n.startsWith(lower) || seen.has(n)) continue
          seen.set(n, {
            name: item.name,
            quantityUnit: item.quantityUnit ?? null,
            price: item.price != null ? Number(item.price) : null,
            imageUrl: item.imageUrl ?? null,
          })
          if (seen.size >= limit) break
        }
        resolve(Array.from(seen.values()))
      }
    }, 200)
  })
}

/** Load recent items (no prefix filter) for the library view. */
export function loadHistory(limit = 50): Promise<HistorySuggestion[]> {
  return api
    .get<HistorySuggestion[]>('/items/history', { params: { q: '', limit } })
    .then(r => r.data)
    .catch(() => {
      const itemsStore = useItemsStore()
      const seen = new Map<string, HistorySuggestion>()
      for (const item of Object.values(itemsStore.itemsByList).flat()) {
        const n = item.name.trim().toLowerCase()
        if (seen.has(n)) continue
        seen.set(n, {
          name: item.name,
          quantityUnit: item.quantityUnit ?? null,
          price: item.price != null ? Number(item.price) : null,
          imageUrl: item.imageUrl ?? null,
        })
        if (seen.size >= limit) break
      }
      return Array.from(seen.values())
    })
}
