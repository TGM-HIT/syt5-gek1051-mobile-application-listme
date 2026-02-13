<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ShoppingList } from '../types'
import ListSection from '../components/list/ListSection.vue'
import ListCard from '../components/list/ListCard.vue'
import FloatingActionButton from '../components/common/FloatingActionButton.vue'
import AddListModal from '../components/common/AddListModal.vue'

const showAddModal = ref(false)

// ── Mock data ──
const myLists = ref<ShoppingList[]>([
  {
    id: '1',
    name: 'Weekly Groceries',
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
  },
  {
    id: '2',
    name: 'Home Supplies',
    emoji: '🏠',
    totalItems: 5,
    checkedItems: 3,
    updatedAt: '1d ago',
    owner: 'me',
    shared: false,
    participants: [],
    accentColor: 'green',
  },
  {
    id: '3',
    name: 'Pharmacy',
    emoji: '💊',
    totalItems: 3,
    checkedItems: 0,
    updatedAt: '3d ago',
    owner: 'me',
    shared: false,
    participants: [],
    accentColor: 'sapphire',
  },
])

const friendsLists = ref<ShoppingList[]>([
  {
    id: '4',
    name: 'Birthday Party Supplies',
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
  },
  {
    id: '5',
    name: 'Office Snacks',
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
  },
])

const allLists = computed(() => [...myLists.value, ...friendsLists.value])

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
        v-for="(list, i) in myLists"
        :key="list.id"
        :list="list"
        :index="i"
      />
    </ListSection>

    <!-- Friends Lists -->
    <ListSection title="Shared with me" :count="friendsLists.length">
      <ListCard
        v-for="(list, i) in friendsLists"
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
