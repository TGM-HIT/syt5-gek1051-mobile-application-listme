<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shareService } from '../services/share'
import { useListsStore } from '../stores/lists'
import { useProfileStore } from '../stores/profile'
import { useThemeStore } from '../stores/theme'
import type { SyncPreviewResponse } from '../types'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const profileStore = useProfileStore()
const themeStore = useThemeStore()

const token = route.params.token as string
const preview = ref<SyncPreviewResponse | null>(null)
const loading = ref(true)
const applying = ref(false)
const error = ref<'not_found' | 'expired' | null>(null)

onMounted(async () => {
  try {
    preview.value = await shareService.previewSyncToken(token)
  } catch (e: any) {
    error.value = e?.response?.status === 410 ? 'expired' : 'not_found'
  } finally {
    loading.value = false
  }
})

async function apply() {
  applying.value = true
  try {
    const result = await shareService.applySyncToken(token)
    profileStore.applyFromSync(result.displayName, result.profilePicture)
    themeStore.theme = result.theme as 'dark' | 'light'
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
    <div v-else-if="preview" class="flex flex-col gap-6 w-full max-w-sm animate-fade-up">
      <!-- Source identity -->
      <div class="text-center">
        <div class="flex items-center justify-center mb-3">
          <div v-if="preview.sourceProfilePicture" class="w-16 h-16 rounded-full overflow-hidden border-2 border-ctp-surface1">
            <img :src="preview.sourceProfilePicture" alt="Profilbild" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-16 h-16 rounded-full bg-ctp-surface0 border-2 border-ctp-surface1 flex items-center justify-center text-2xl">
            👤
          </div>
        </div>
        <h2 class="text-xl font-bold text-ctp-text">
          {{ preview.sourceDisplayName ? `${preview.sourceDisplayName}s Gerät verknüpfen` : 'Gerät verknüpfen' }}
        </h2>
        <p class="text-sm text-ctp-subtext0 mt-1">
          {{ preview.lists.length }} {{ preview.lists.length === 1 ? 'Liste wird' : 'Listen werden' }} auf dieses Gerät übertragen
        </p>
      </div>

      <!-- What gets synced -->
      <div class="bg-ctp-surface0/40 border border-ctp-surface1/50 rounded-xl px-4 py-3 space-y-1.5 text-sm text-ctp-subtext1">
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>Alle Listen & Einträge</span>
        </div>
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>Profilbild & Name</span>
        </div>
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>Vorlagen (Presets)</span>
        </div>
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>Design-Thema</span>
        </div>
      </div>

      <!-- List preview -->
      <div class="space-y-2">
        <div
          v-for="list in preview.lists"
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
          class="w-full py-3 bg-linear-to-r from-ctp-teal to-ctp-sapphire text-ctp-base font-semibold rounded-xl disabled:opacity-60 transition-opacity"
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
