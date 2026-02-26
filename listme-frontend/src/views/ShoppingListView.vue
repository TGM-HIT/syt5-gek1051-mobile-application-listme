<script setup lang="ts">
import { ref, computed } from 'vue';
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

const filteredItems = computed(() => {
  let items = shoppingList.value?.items || [];

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
  const newItem: Item = {
    id: crypto.randomUUID(),
    name: newItemName.value,
    checked: false,
    position: shoppingList.value.items.length + 1,
    categoryId: newItemSelectedCategory.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  shoppingList.value.items.push(newItem);
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
          <span :class="{ 'line-through': item.checked }">{{ item.name }}</span>
          <input type="checkbox" v-model="item.checked" />
        </li>
      </ul>
    </div>
    <div class="mt-4">
      <input v-model="newItemName" @keyup.enter="addItem" placeholder="Add new item" class="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal mb-4" />
      <select v-model="newItemSelectedCategory" class="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal mb-4">
        <option v-for="category in shoppingList.categories" :value="category.id">{{ category.name }}</option>
      </select>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>
