<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shareService } from '../services/share'
import { useListsStore } from '../stores/lists'
import type { ShoppingList } from '../types'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()

const token = route.params.token as string
const lists = ref<ShoppingList[]>([])
const loading = ref(true)
const applying = ref(false)
const error = ref<'not_found' | 'expired' | null>(null)

onMounted(async () => {
  try {
    lists.value = await shareService.previewSyncToken(token)
  } catch (e: any) {
    error.value = e?.response?.status === 410 ? 'expired' : 'not_found'
  } finally {
    loading.value = false
  }
})

async function apply() {
  applying.value = true
  try {
    await shareService.applySyncToken(token)
    await listsStore.fetchAll()
    router.push({ name: 'home' })
  } catch (e: any) {
    error.value = e?.response?.status === 410 ? 'expired' : 'not_found'
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-ctp-base flex flex-col items-center justify-center px-6 py-16">

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-4 w-full max-w-sm">
      <div v-for="n in 3" :key="n" class="h-16 w-full bg-ctp-surface0 rounded-xl skeleton" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center gap-4 text-center animate-fade-up">
      <span class="text-5xl">{{ error === 'expired' ? '⏳' : '❌' }}</span>
      <h2 class="text-xl font-bold text-ctp-text">
        {{ error === 'expired' ? 'Link abgelaufen' : 'Link ungültig' }}
      </h2>
      <p class="text-sm text-ctp-subtext0 max-w-xs">
        {{ error === 'expired'
          ? 'Sync-Links sind 30 Tage gültig. Bitte erstelle einen neuen Link auf dem anderen Gerät.'
          : 'Dieser Sync-Link wurde nicht gefunden.' }}
      </p>
      <button
        @click="router.push({ name: 'home' })"
        class="mt-2 px-6 py-2.5 bg-ctp-surface0 text-ctp-text rounded-xl font-medium text-sm"
      >
        Zur Startseite
      </button>
    </div>

    <!-- Preview + apply -->
    <div v-else class="flex flex-col gap-6 w-full max-w-sm animate-fade-up">
      <div class="text-center">
        <span class="text-4xl">🔗</span>
        <h2 class="text-xl font-bold text-ctp-text mt-3">Geräte verknüpfen</h2>
        <p class="text-sm text-ctp-subtext0 mt-1">
          {{ lists.length }} {{ lists.length === 1 ? 'Liste wird' : 'Listen werden' }} auf dieses Gerät übertragen
        </p>
      </div>

      <!-- List preview -->
      <div class="space-y-2">
        <div
          v-for="list in lists"
          :key="list.id"
          class="flex items-center gap-3 bg-ctp-surface0/60 border border-ctp-surface1/50 rounded-xl px-4 py-3"
        >
          <span class="text-xl">{{ list.emoji }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-ctp-text truncate">{{ list.name }}</p>
            <p class="text-xs text-ctp-subtext0">{{ list.itemCount }} Items</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <button
          @click="apply"
          :disabled="applying"
          class="w-full py-3 bg-gradient-to-r from-ctp-teal to-ctp-sapphire text-ctp-base font-semibold rounded-xl disabled:opacity-60 transition-opacity"
        >
          {{ applying ? 'Importiere…' : 'Alle Listen importieren' }}
        </button>
        <button
          @click="router.push({ name: 'home' })"
          class="w-full py-2.5 text-ctp-subtext0 text-sm rounded-xl hover:text-ctp-text transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  </div>
</template>
