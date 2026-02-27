<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import type { ShoppingList, Category, Item } from '../types';
import { myLists as mockMyLists, friendsLists as mockFriendsLists, mockCategories } from '../data/mock'

const route = useRoute();
const listId = route.params.id as string;

const shoppingList = computed(() => {
  const allLists = [...mockMyLists, ...mockFriendsLists];
  return allLists.find(list => list.id === listId);
});

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

// Local reactive items source for UI rendering to avoid needing full page reloads
const itemsRef = ref<Item[]>([]);

onMounted(() => {
  if (shoppingList.value?.items) {
    itemsRef.value = [...shoppingList.value.items];
  }
});

const filteredItems = computed(() => {
  let items = itemsRef.value || [];

  if (searchQuery.value) {
    items = items.filter(item => item.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  if (selectedCategory.value) {
    items = items.filter(item => item.categoryId === selectedCategory.value);
  }

  return items;
});

const groupedItems = computed(() => {
  const groups: { [key: string]: Item[] } = {};
  for (const item of filteredItems.value) {
    const categoryId = item.categoryId || 'c4'; // Default to 'Other'
    if (!groups[categoryId]) {
      groups[categoryId] = [];
    }
    groups[categoryId].push(item);
  }
  return groups;
});

function getCategory(categoryId: string): Category | undefined {
  return shoppingList.value?.categories.find(c => c.id === categoryId);
}

const newItemName = ref('');
const newItemSelectedCategory = ref(mockCategories[0]?.id || '');

function addItem() {
  if (!shoppingList.value) return;
  const name = newItemName.value.trim();
  if (!name) return;
  const newItem: Item = {
    id: crypto.randomUUID(),
    name,
    checked: false,
    position: (shoppingList.value.items?.length || 0) + 1,
    categoryId: newItemSelectedCategory.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Update local reactive list for instant UI feedback
  itemsRef.value = [...itemsRef.value, newItem];
  // Also update the underlying list for consistency (mutate, do not reassign)
  shoppingList.value.items.push(newItem);
  if (typeof shoppingList.value.totalItems === 'number') {
    shoppingList.value.totalItems += 1;
  }
  // Do not change selected category after adding; keep user's context
  searchQuery.value = '';
  newItemName.value = '';
}
</script>

<template>
  <div v-if="shoppingList" class="pt-16 pb-24 px-5 max-w-lg mx-auto">
    <div class="flex items-center mb-4">
      <router-link to="/" class="text-ctp-text">&lt; Back</router-link>
    </div>
    <h1 class="text-2xl font-bold text-ctp-text mb-4">{{ shoppingList.emoji }} {{ shoppingList.name }}</h1>

    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search items..."
      class="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal mb-4"
    />

    <div class="flex space-x-2 mb-4">
      <button @click="selectedCategory = null" :class="['px-3 py-1 rounded-full text-sm', { 'bg-ctp-teal text-ctp-base': !selectedCategory }]">All</button>
      <button
        v-for="category in shoppingList.categories"
        :key="category.id"
        @click="selectedCategory = category.id"
        :class="['px-3 py-1 rounded-full text-sm', { 'bg-ctp-teal text-ctp-base': selectedCategory === category.id }]"
        :style="{ backgroundColor: selectedCategory === category.id ? category.color : '' }"
      >
        {{ category.name }}
      </button>
    </div>

    <div v-for="(items, categoryId) in groupedItems" :key="categoryId" class="mb-4">
      <h2 class="text-lg font-bold text-ctp-text mb-2" :style="{ color: getCategory(categoryId)?.color }">{{ getCategory(categoryId)?.name }}</h2>
      <ul>
        <li v-for="item in items" :key="item.id" class="flex items-center justify-between py-2 border-b border-ctp-surface1">
          <span :class="['text-ctp-text flex-1', { 'line-through text-ctp-overlay0': item.checked }]">{{ item.name }}</span>
          <input type="checkbox" v-model="item.checked" class="round-checkbox text-ctp-teal border-ctp-surface2" />
        </li>
      </ul>
    </div>
    <div class="mt-4">
      <div class="flex gap-2 mb-3">
        <input v-model="newItemName" @keyup.enter="addItem" placeholder="Neues Item hinzufügen" class="flex-1 px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal" />
        <button @click="addItem" :disabled="!newItemName.trim()" class="px-4 py-2 rounded-lg bg-ctp-teal text-ctp-base disabled:opacity-50 disabled:cursor-not-allowed">Hinzufügen</button>
      </div>
      <select v-model="newItemSelectedCategory" class="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal">
        <option v-for="category in shoppingList.categories" :value="category.id">{{ category.name }}</option>
      </select>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>
