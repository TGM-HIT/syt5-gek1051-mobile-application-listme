<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ShoppingList } from '../types'
import ListSection from '../components/list/ListSection.vue'
import ListCard from '../components/list/ListCard.vue'
import FloatingActionButton from '../components/common/FloatingActionButton.vue'
import AddListModal from '../components/common/AddListModal.vue'
import { myLists as mockMyLists, friendsLists as mockFriendsLists } from '../data/mock'

const showAddModal = ref(false)
const searchQuery = ref('')

const myLists = ref<ShoppingList[]>(mockMyLists)
const friendsLists = ref<ShoppingList[]>(mockFriendsLists)

const allLists = computed(() => [...myLists.value, ...friendsLists.value])

const filteredLists = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const all = allLists.value;
  if (!query) return {myLists: myLists.value, friendsLists: friendsLists.value};

  const filtered = all.filter(list =>
    list.name.toLowerCase().includes(query) ||
    list.items.some(item => item.name.toLowerCase().includes(query))
  );

  return {
    myLists: filtered.filter(l => myLists.value.some(ml => ml.id === l.id)),
    friendsLists: filtered.filter(l => friendsLists.value.some(fl => fl.id === l.id))
  }
})

function handleCreate(name: string, emoji: string) {
  const colors: Array<'green' | 'teal' | 'sapphire'> = ['green', 'teal', 'sapphire']
  myLists.value.unshift({
    id: crypto.randomUUID(),
    name,
    emoji,
    totalItems: 0,
    checkedItems: 0,
    updatedAt: 'just now',
    owner: 'me',
    shared: false,
    participants: [],
    accentColor: colors[myLists.value.length % 3] ?? 'teal',
    categories: [],
    items: [],
  })
}
</script>

<template>
  <div class="pt-16 pb-24 px-5 max-w-lg mx-auto">
    <!-- Greeting -->
    <div class="mt-4 mb-6 animate-fade-up">
      <p class="text-ctp-overlay1 text-sm">Good afternoon</p>
      <h2 class="text-2xl font-bold text-ctp-text mt-0.5">
        Your Lists
        <span class="text-ctp-overlay0 font-normal text-base ml-1">
          ({{ allLists.length }})
        </span>
      </h2>
    </div>

    <!-- Search Bar -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search lists or items..."
      class="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-teal mb-4"
    />

    <!-- Quick stats -->
    <div class="grid grid-cols-3 gap-3 mb-8 animate-fade-up" style="animation-delay: 60ms">
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-green tabular-nums">{{ allLists.reduce((a, l) => a + l.checkedItems, 0) }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Done</p>
      </div>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-teal tabular-nums">{{ allLists.reduce((a, l) => a + l.totalItems - l.checkedItems, 0) }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Remaining</p>
      </div>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-sapphire tabular-nums">{{ allLists.filter(l => l.shared).length }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Shared</p>
      </div>
    </div>

    <!-- My Lists -->
    <ListSection title="My Lists" :count="myLists.length" class="mb-8">
      <ListCard
        v-for="(list, i) in filteredLists.myLists"
        :key="list.id"
        :list="list"
        :index="i"
      />
    </ListSection>

    <!-- Friends Lists -->
    <ListSection title="Shared with me" :count="friendsLists.length">
      <ListCard
        v-for="(list, i) in filteredLists.friendsLists"
        :key="list.id"
        :list="list"
        :index="i + myLists.length"
      />

      <!-- Empty state hint -->
      <div
        v-if="friendsLists.length === 0"
        class="text-center py-8 animate-fade-up"
      >
        <p class="text-ctp-overlay0 text-sm">No shared lists yet</p>
        <p class="text-ctp-surface2 text-xs mt-1">Invite friends to collaborate</p>
      </div>
    </ListSection>

    <!-- FAB -->
    <FloatingActionButton @click="showAddModal = true" />

    <!-- Add modal -->
    <AddListModal
      :open="showAddModal"
      @close="showAddModal = false"
      @create="handleCreate"
    />
  </div>
</template>
