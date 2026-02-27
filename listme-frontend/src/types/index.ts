export interface Category {
  id: string
  name: string
  color: string
  listId: string
  position: number
}

export interface Item {
  id: string
  name: string
  checked: boolean
  position: number
  categoryId?: string
  createdAt: string
  updatedAt: string
}

export interface ShoppingList {
  id: string
  name: string
  emoji: string
  totalItems: number
  checkedItems: number
  updatedAt: string
  owner: string
  shared: boolean
  participants: Participant[]
  accentColor: 'green' | 'teal' | 'sapphire'
  categories: Category[]
  items: Item[]
}

export interface Participant {
  id: string
  name: string
  avatarUrl?: string
  initials: string
  online: boolean
}
