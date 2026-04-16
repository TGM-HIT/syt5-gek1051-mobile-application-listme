<template>
  <div class="min-h-screen bg-ctp-base pb-28 pt-14">
    <!-- Header -->
    <div class="sticky top-14 z-30 bg-ctp-mantle/80 backdrop-blur-xl border-b border-ctp-surface0">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        <span class="text-lg font-bold text-ctp-text flex-1">Bibliothek</span>
      </div>
      <!-- Search -->
      <div class="max-w-lg mx-auto px-4 pb-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ctp-overlay0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Artikel oder Vorlage suchen…"
            class="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-xl pl-9 pr-4 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-teal transition-colors"
          />
        </div>
      </div>
    </div>

    <div class="max-w-lg mx-auto px-4 pt-4 space-y-6">

      <!-- ── Presets ────────────────────────────────────────────────────────── -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-ctp-subtext0 uppercase tracking-wide">Vorlagen</h2>
          <span class="text-xs text-ctp-overlay0">{{ filteredPresets.length }}</span>
        </div>

        <!-- Loading -->
        <div v-if="presetsLoading" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-16 bg-ctp-surface0 rounded-2xl skeleton" />
        </div>

        <!-- Empty -->
        <div v-else-if="filteredPresets.length === 0" class="py-6 text-center">
          <p class="text-ctp-overlay0 text-sm">Keine Vorlagen gefunden.</p>
        </div>

        <!-- Cards -->
        <div v-else class="space-y-2">
          <div
            v-for="preset in filteredPresets"
            :key="preset.id"
            class="flex items-center gap-3 bg-ctp-surface0 rounded-2xl px-4 py-3"
          >
            <span class="text-2xl shrink-0">{{ preset.emoji }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="font-medium text-sm text-ctp-text truncate">{{ preset.name }}</p>
                <span v-if="preset.system" class="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-ctp-teal/15 text-ctp-teal">Standard</span>
              </div>
              <p class="text-xs text-ctp-overlay0">{{ preset.itemCount }} Artikel</p>
            </div>
            <!-- Use preset -->
            <button
              @click="usePreset(preset)"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-ctp-teal/10 text-ctp-teal text-xs font-medium hover:bg-ctp-teal/20 transition-colors"
            >
              Verwenden
            </button>
            <!-- Delete (only for user-created presets) -->
            <button
              v-if="!preset.system"
              @click="confirmDeletePreset(preset)"
              class="shrink-0 p-1.5 rounded-xl text-ctp-overlay0 hover:text-ctp-red hover:bg-ctp-red/10 transition-colors"
              aria-label="Vorlage löschen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- ── Item History ───────────────────────────────────────────────────── -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-ctp-subtext0 uppercase tracking-wide">Meine Artikel</h2>
          <span class="text-xs text-ctp-overlay0">{{ filteredHistory.length }}</span>
        </div>

        <!-- Loading -->
        <div v-if="historyLoading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-14 bg-ctp-surface0 rounded-2xl skeleton" />
        </div>

        <!-- Empty -->
        <div v-else-if="filteredHistory.length === 0" class="py-6 text-center">
          <p class="text-ctp-overlay0 text-sm">{{ searchQuery ? 'Keine Treffer.' : 'Noch keine Artikel hinzugefügt.' }}</p>
        </div>

        <!-- Grid -->
        <div v-else class="space-y-1.5">
          <div
            v-for="item in filteredHistory"
            :key="item.name"
            class="flex items-center gap-3 bg-ctp-surface0 rounded-2xl px-3 py-2.5"
          >
            <!-- Thumbnail -->
            <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-ctp-surface1 flex items-center justify-center">
              <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover" alt="" />
              <svg v-else class="w-5 h-5 text-ctp-overlay0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ctp-text truncate">{{ item.name }}</p>
              <p v-if="item.quantityUnit || item.price" class="text-xs text-ctp-overlay0">
                <span v-if="item.quantityUnit">{{ item.quantityUnit }}</span>
                <span v-if="item.quantityUnit && item.price"> · </span>
                <span v-if="item.price">€{{ Number(item.price).toFixed(2) }}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Confirm delete dialog -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="deletingPreset" class="fixed inset-0 z-50 flex flex-col justify-end">
          <div class="absolute inset-0 bg-ctp-crust/60 backdrop-blur-sm" @click="deletingPreset = null" />
          <div class="relative bg-ctp-mantle rounded-t-2xl px-5 pt-4 pb-10 safe-bottom">
            <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-4" />
            <p class="text-base font-semibold text-ctp-text mb-1">Vorlage löschen?</p>
            <p class="text-sm text-ctp-subtext0 mb-5">„{{ deletingPreset.name }}" wird dauerhaft gelöscht.</p>
            <div class="flex gap-3">
              <button @click="deletingPreset = null" class="flex-1 py-3 rounded-xl bg-ctp-surface0 text-ctp-subtext0 text-sm font-medium">Abbrechen</button>
              <button @click="doDeletePreset" class="flex-1 py-3 rounded-xl bg-ctp-red text-white text-sm font-semibold">Löschen</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserId } from '../services/userId'
import { presetService, type Preset } from '../services/preset'
import { loadHistory, type HistorySuggestion } from '../services/itemHistory'

const router = useRouter()

const searchQuery = ref('')
const presetsLoading = ref(true)
const historyLoading = ref(true)
const presets = ref<Preset[]>([])
const history = ref<HistorySuggestion[]>([])
const deletingPreset = ref<Preset | null>(null)

const filteredPresets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return presets.value
  return presets.value.filter(p => p.name.toLowerCase().includes(q))
})

const filteredHistory = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return history.value
  return history.value.filter(i => i.name.toLowerCase().includes(q))
})

onMounted(async () => {
  presetsLoading.value = true
  historyLoading.value = true
  const [p, h] = await Promise.allSettled([
    presetService.getAll(),
    loadHistory(100),
  ])
  presets.value = p.status === 'fulfilled' ? p.value : []
  history.value = h.status === 'fulfilled' ? h.value : []
  presetsLoading.value = false
  historyLoading.value = false
})

function usePreset(preset: Preset) {
  // Navigate to home with a query param; AddListModal picks it up
  router.push({ name: 'home', params: { userId: getUserId()! }, query: { presetId: preset.id, presetEmoji: preset.emoji, presetName: preset.name } })
}

function confirmDeletePreset(preset: Preset) {
  deletingPreset.value = preset
}

async function doDeletePreset() {
  if (!deletingPreset.value) return
  await presetService.delete(deletingPreset.value.id)
  presets.value = presets.value.filter(p => p.id !== deletingPreset.value!.id)
  deletingPreset.value = null
}
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, var(--color-ctp-surface0) 25%, var(--color-ctp-surface1) 50%, var(--color-ctp-surface0) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
</style>
