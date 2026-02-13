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
}

export interface Participant {
  id: string
  name: string
  avatarUrl?: string
  initials: string
  online: boolean
}
