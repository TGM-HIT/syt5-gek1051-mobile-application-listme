<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shareService } from '../services/share'
import { useListsStore } from '../stores/lists'
import { getUserId } from '../services/userId'
import type { ShoppingList } from '../types'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()

const token = route.params.token as string
const list = ref<ShoppingList | null>(null)
const loading = ref(true)
const joining = ref(false)
const notFound = ref(false)

onMounted(async () => {
  try {
    list.value = await shareService.previewToken(token)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function join() {
  if (!list.value) return
  joining.value = true
  try {
    const joined = await shareService.joinViaToken(token)
    await listsStore.fetchAll()
    router.push({ name: 'list-detail', params: { id: joined.id } })
  } catch {
    notFound.value = true
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-ctp-base flex flex-col items-center justify-center px-6 py-16">

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-ctp-surface0 skeleton" />
      <div class="h-4 w-32 bg-ctp-surface0 rounded skeleton" />
    </div>

    <!-- Not found / expired -->
    <div v-else-if="notFound" class="flex flex-col items-center gap-4 text-center animate-fade-up">
      <span class="text-5xl">❌</span>
      <h2 class="text-xl font-bold text-ctp-text">Link ungültig</h2>
      <p class="text-sm text-ctp-subtext0 max-w-xs">
        Dieser Einladungslink ist abgelaufen oder wurde widerrufen.
      </p>
      <button
        @click="router.push({ name: 'home', params: { userId: getUserId()! } })"
        class="mt-2 px-6 py-2.5 bg-ctp-surface0 text-ctp-text rounded-xl font-medium text-sm"
      >
        Zur Startseite
      </button>
    </div>

    <!-- Preview + join -->
    <div v-else-if="list" class="flex flex-col items-center gap-6 text-center animate-fade-up max-w-sm w-full">
      <!-- List card preview -->
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/50 border-l-[3px] border-l-ctp-teal rounded-2xl p-6 w-full">
        <span class="text-5xl">{{ list.emoji }}</span>
        <h2 class="text-xl font-bold text-ctp-text mt-3">{{ list.name }}</h2>
        <p class="text-sm text-ctp-subtext0 mt-1">
          {{ list.itemCount }} {{ list.itemCount === 1 ? 'Item' : 'Items' }}
          · {{ list.participantCount }} {{ list.participantCount === 1 ? 'Teilnehmer' : 'Teilnehmer' }}
        </p>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <p class="text-xs text-ctp-subtext0">Du wurdest zu dieser Liste eingeladen</p>
        <button
          @click="join"
          :disabled="joining"
          class="w-full py-3 bg-gradient-to-r from-ctp-teal to-ctp-sapphire text-ctp-base font-semibold rounded-xl disabled:opacity-60 transition-opacity"
        >
          {{ joining ? 'Trete bei…' : 'Dieser Liste beitreten' }}
        </button>
        <button
          @click="router.push({ name: 'home', params: { userId: getUserId()! } })"
          class="w-full py-2.5 text-ctp-subtext0 text-sm rounded-xl hover:text-ctp-text transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  </div>
</template>
