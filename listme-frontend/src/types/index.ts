// API types (match backend DTOs)

export interface ShoppingList {
  id: string
  name: string
  emoji: string
  shareToken: string | null
  itemCount: number
  checkedCount: number
  participantCount: number
  createdAt: string
  updatedAt: string
}

export interface Label {
  id: string
  name: string
  color: string | null
}

export interface Favorite {
  id: string
  itemName: string
  emoji: string | null
}

export interface Item {
  id: string
  listId: string
  name: string
  checked: boolean
  position: number
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  quantity: number | null
  quantityUnit: string | null
  price: number | null
  imageUrl: string | null
  labels: Label[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByDeviceId: string | null
}

export interface BudgetSummary {
  total: number
  byCategory: Record<string, number>
}

export interface Category {
  id: string
  name: string
  color: string | null
  position: number
}

// API response types for sharing

export interface ShareTokenResponse {
  token: string
  listId: string
  listName: string
}

export interface SyncTokenResponse {
  token: string
  listCount: number
  expiresAt: string
}

export interface SyncPreviewResponse {
  lists: ShoppingList[]
  sourceDisplayName: string | null
  sourceProfilePicture: string | null
  theme: string
}

export interface SyncApplyResponse {
  lists: ShoppingList[]
  displayName: string | null
  profilePicture: string | null
  theme: string
  presetsImported: number
}

export interface ParticipantResponse {
  deviceId: string
  role: string
  joinedAt: string
  displayName: string | null
  profilePicture: string | null
}

// UI-only helpers

export type AccentColor = 'green' | 'teal' | 'sapphire'

export interface Participant {
  id: string
  initials: string
  online: boolean
}

// Request types

export interface CreateListRequest {
  name: string
  emoji?: string
  presetId?: string | null
}

export interface UpdateListRequest {
  name: string
  emoji?: string
}

export interface CreateItemRequest {
  name: string
  categoryId?: string
  labelIds?: string[]
  quantity?: number | null
  quantityUnit?: string | null
  price?: number | null
  imageUrl?: string | null
}

export interface UpdateItemRequest {
  name: string
  categoryId?: string
  labelIds?: string[]
  quantity?: number | null
  quantityUnit?: string | null
  price?: number | null
  imageUrl?: string | null
}

export interface CreateLabelRequest {
  name: string
  color?: string
}

export interface CreateFavoriteRequest {
  itemName: string
  emoji?: string
}

export interface CreateCategoryRequest {
  name: string
  color?: string
}
