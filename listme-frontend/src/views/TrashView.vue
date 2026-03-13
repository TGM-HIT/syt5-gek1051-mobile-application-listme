<template>
  <div class="min-h-screen bg-ctp-base">
    <!-- Header -->
    <div class="sticky top-0 z-30 bg-ctp-mantle/80 backdrop-blur-xl border-b border-ctp-surface0 safe-top">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        <button
          @click="router.back()"
          aria-label="Zurück"
          class="p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="font-semibold text-ctp-text">Papierkorb</h1>
          <p class="text-xs text-ctp-subtext0">{{ list?.name }}</p>
        </div>
        <button
          v-if="trashedItems.length > 0"
          @click="confirmEmptyTrash = true"
          class="text-xs text-ctp-red font-medium px-3 py-1.5 rounded-xl hover:bg-ctp-red/10 transition-colors"
        >
          Alle löschen
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-lg mx-auto px-4 py-4 pb-10">
      <!-- Loading -->
      <div v-if="loading" class="space-y-2 mt-2">
        <div v-for="n in 3" :key="n" class="h-14 bg-ctp-surface0 rounded-xl skeleton" />
      </div>

      <!-- Empty trash -->
      <div v-else-if="trashedItems.length === 0" class="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span class="text-5xl">🗑️</span>
        <p class="text-ctp-subtext0 text-sm">Papierkorb ist leer</p>
        <p class="text-ctp-overlay0 text-xs">Gelöschte Items erscheinen hier</p>
      </div>

      <!-- Trash items -->
      <div v-else class="space-y-2 animate-fade-up">
        <p class="text-xs text-ctp-overlay0 px-1 mb-3">
          Items im Papierkorb können wiederhergestellt werden.
        </p>
        <div
          v-for="item in trashedItems"
          :key="item.id"
          class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <!-- Thumbnail -->
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            class="w-10 h-10 rounded-xl object-cover shrink-0 opacity-60"
            :alt="item.name"
          />
          <div v-else class="w-10 h-10 rounded-xl bg-ctp-surface1 shrink-0 flex items-center justify-center opacity-60">
            <svg class="w-5 h-5 text-ctp-overlay0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ctp-text/70 line-through truncate">{{ item.name }}</p>
            <p class="text-xs text-ctp-overlay0 mt-0.5">
              {{ formatDeleted(item.deletedAt) }}
              <span v-if="item.quantity"> · {{ item.quantity }} {{ item.quantityUnit }}</span>
              <span v-if="item.price"> · €{{ item.price }}</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <button
              @click="restoreItem(item)"
              :disabled="restoringId === item.id"
              class="p-2 rounded-xl text-ctp-teal hover:bg-ctp-teal/10 transition-colors disabled:opacity-40"
              title="Wiederherstellen"
              aria-label="Wiederherstellen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              @click="deletePermanently(item)"
              :disabled="deletingId === item.id"
              class="p-2 rounded-xl text-ctp-red hover:bg-ctp-red/10 transition-colors disabled:opacity-40"
              title="Endgültig löschen"
              aria-label="Endgültig löschen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm empty trash -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="confirmEmptyTrash" class="fixed inset-0 z-50 flex items-end justify-center p-4 bg-ctp-crust/50 backdrop-blur-sm" @click.self="confirmEmptyTrash = false">
          <div class="bg-ctp-mantle border border-ctp-surface1 rounded-2xl p-5 w-full max-w-sm animate-scale-in">
            <h3 class="font-semibold text-ctp-text mb-1">Papierkorb leeren?</h3>
            <p class="text-sm text-ctp-subtext0 mb-4">Alle {{ trashedItems.length }} Items werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.</p>
            <div class="flex gap-3">
              <button @click="confirmEmptyTrash = false" class="flex-1 py-2.5 rounded-xl bg-ctp-surface0 text-ctp-subtext0 text-sm font-medium">Abbrechen</button>
              <button @click="emptyTrash" class="flex-1 py-2.5 rounded-xl bg-ctp-red text-white text-sm font-semibold">Leeren</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { itemService } from '../services/item'
import type { Item } from '../types'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const listId = route.params.id as string

const list = computed(() => listsStore.getById(listId))
const trashedItems = ref<Item[]>([])
const loading = ref(true)
const restoringId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const confirmEmptyTrash = ref(false)

onMounted(async () => {
  if (!list.value) await listsStore.fetchAll()
  try {
    trashedItems.value = await itemService.getTrash(listId)
  } finally {
    loading.value = false
  }
})

function formatDeleted(deletedAt: string | null | undefined): string {
  if (!deletedAt) return 'Gelöscht'
  const d = new Date(deletedAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  if (diffMin < 1) return 'Gerade eben gelöscht'
  if (diffMin < 60) return `Vor ${diffMin} Min. gelöscht`
  if (diffH < 24) return `Vor ${diffH} Std. gelöscht`
  return `Vor ${diffD} Tag${diffD !== 1 ? 'en' : ''} gelöscht`
}

async function restoreItem(item: Item) {
  restoringId.value = item.id
  try {
    await itemService.restore(listId, item.id)
    trashedItems.value = trashedItems.value.filter(i => i.id !== item.id)
  } finally {
    restoringId.value = null
  }
}

async function deletePermanently(item: Item) {
  deletingId.value = item.id
  try {
    await itemService.permanentDelete(listId, item.id)
    trashedItems.value = trashedItems.value.filter(i => i.id !== item.id)
  } finally {
    deletingId.value = null
  }
}

async function emptyTrash() {
  confirmEmptyTrash.value = false
  await Promise.all(trashedItems.value.map(i => itemService.permanentDelete(listId, i.id)))
  trashedItems.value = []
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
