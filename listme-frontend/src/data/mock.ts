import type { ShoppingList, Category, Item } from '../types';

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Obst', color: '#F00', listId: '1', position: 1 },
  { id: 'c2', name: 'Gemüse', color: '#0F0', listId: '1', position: 2 },
  { id: 'c3', name: 'Milchprodukte', color: '#00F', listId: '1', position: 3 },
  { id: 'c4', name: 'Sonstiges', color: '#808080', listId: '1', position: 4 },
];

export const mockItems: Item[] = [
  { id: 'i1', name: 'Apfel', checked: false, position: 1, categoryId: 'c1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'i2', name: 'Banane', checked: true, position: 2, categoryId: 'c1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'i3', name: 'Karotte', checked: false, position: 1, categoryId: 'c2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'i4', name: 'Milch', checked: false, position: 1, categoryId: 'c3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

export const myLists: ShoppingList[] = [
  {
    id: '1',
    name: 'Wöchentliche Einkäufe',
    emoji: '🛒',
    totalItems: 12,
    checkedItems: 8,
    updatedAt: '2h ago',
    owner: 'me',
    shared: true,
    participants: [
      { id: 'u1', name: 'Sarah', initials: 'SA', online: true },
      { id: 'u2', name: 'Mike', initials: 'MK', online: false },
    ],
    accentColor: 'teal',
    categories: mockCategories,
    items: mockItems,
  },
  {
    id: '2',
    name: 'Haushaltsbedarf',
    emoji: '🏠',
    totalItems: 5,
    checkedItems: 3,
    updatedAt: '1d ago',
    owner: 'me',
    shared: false,
    participants: [],
    accentColor: 'green',
    categories: mockCategories,
    items: [],
  },
  {
    id: '3',
    name: 'Apotheke',
    emoji: '💊',
    totalItems: 3,
    checkedItems: 0,
    updatedAt: '3d ago',
    owner: 'me',
    shared: false,
    participants: [],
    accentColor: 'sapphire',
    categories: mockCategories,
    items: [],
  },
];

export const friendsLists: ShoppingList[] = [
  {
    id: '4',
    name: 'Geburtstagsparty-Zubehör',
    emoji: '🎂',
    totalItems: 18,
    checkedItems: 7,
    updatedAt: '30m ago',
    owner: 'Sarah',
    shared: true,
    participants: [
      { id: 'u1', name: 'Sarah', initials: 'SA', online: true },
      { id: 'u3', name: 'Oli', initials: 'OG', online: true },
      { id: 'u4', name: 'Emma', initials: 'EM', online: false },
      { id: 'u5', name: 'Luca', initials: 'LC', online: false },
    ],
    accentColor: 'teal',
    categories: mockCategories,
    items: [],
  },
  {
    id: '5',
    name: 'Büro-Snacks',
    emoji: '🍕',
    totalItems: 8,
    checkedItems: 8,
    updatedAt: '5h ago',
    owner: 'Mike',
    shared: true,
    participants: [
      { id: 'u2', name: 'Mike', initials: 'MK', online: false },
      { id: 'u6', name: 'Anna', initials: 'AN', online: true },
    ],
    accentColor: 'green',
    categories: mockCategories,
    items: [],
  },
];
