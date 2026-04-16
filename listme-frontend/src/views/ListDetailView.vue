<template>
  <div class="min-h-screen bg-ctp-base">
    <!-- Connection banner -->
    <ConnectionBanner :connected="syncConnected" />

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

        <div class="flex-1 min-w-0">
          <div v-if="list" class="flex items-center gap-2">
            <span class="text-xl">{{ list.emoji }}</span>
            <span class="font-semibold text-ctp-text truncate">{{ list.name }}</span>
          </div>
          <div v-else class="h-5 w-32 bg-ctp-surface0 rounded skeleton" />
        </div>

        <!-- Online count + progress chip + share button -->
        <div class="flex items-center gap-2 shrink-0">
          <div v-if="onlineCount > 1" class="flex items-center gap-1 text-xs text-ctp-teal">
            <span class="w-1.5 h-1.5 rounded-full bg-ctp-teal animate-pulse" />
            <span>{{ onlineCount }}</span>
          </div>
          <div v-if="list && list.itemCount > 0" class="text-xs font-medium text-ctp-subtext0">
            {{ list.checkedCount }}/{{ list.itemCount }}
          </div>
          <!-- Search button -->
          <button
            @click="toggleSearch"
            class="p-2 rounded-xl transition-colors"
            :class="showSearch ? 'text-ctp-teal bg-ctp-surface0' : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0'"
            title="Suchen"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <!-- Export button -->
          <div v-if="list" class="relative">
            <button
              @click="showExportMenu = !showExportMenu"
              class="p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-teal hover:bg-ctp-surface0 transition-colors"
              aria-label="Liste exportieren"
              title="Exportieren"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <!-- Backdrop -->
            <div v-if="showExportMenu" class="fixed inset-0 z-40" @click="showExportMenu = false" />
            <!-- Dropdown -->
            <div
              v-if="showExportMenu"
              class="absolute right-0 top-full mt-1 z-50 bg-ctp-mantle border border-ctp-surface1 rounded-2xl shadow-xl overflow-hidden min-w-32.5"
            >
              <button
                @click="doExport('csv')"
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ctp-text hover:bg-ctp-surface0 transition-colors text-left"
              >
                <svg class="w-4 h-4 text-ctp-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                CSV
              </button>
              <button
                @click="doExport('pdf')"
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ctp-text hover:bg-ctp-surface0 transition-colors text-left border-t border-ctp-surface1/50"
              >
                <svg class="w-4 h-4 text-ctp-red shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>

          <!-- Trash button -->
          <button
            v-if="list"
            @click="router.push({ name: 'list-trash', params: { id: listId } })"
            class="p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-red hover:bg-ctp-surface0 transition-colors"
            aria-label="Papierkorb"
            title="Papierkorb"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <!-- Save as preset button -->
          <button
            v-if="list"
            @click="openSavePreset"
            class="p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-yellow hover:bg-ctp-surface0 transition-colors"
            aria-label="Als Vorlage speichern"
            title="Als Vorlage speichern"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <!-- Share button -->
          <button
            v-if="list"
            @click="showShareModal = true"
            class="p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-teal hover:bg-ctp-surface0 transition-colors"
            aria-label="Liste teilen"
            title="Liste teilen"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Search bar -->
      <Transition name="search">
        <div v-if="showSearch" class="max-w-lg mx-auto px-4 pb-3">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            placeholder="Items suchen…"
            class="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-xl px-4 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-teal transition-colors"
          />
        </div>
      </Transition>

      <!-- Category filter chips -->
      <Transition name="search">
        <div v-if="listCategories.length > 0" class="max-w-lg mx-auto px-4 pb-2">
          <div class="flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              @click="activeCategoryId = null"
              class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :class="activeCategoryId === null
                ? 'bg-ctp-teal text-ctp-base'
                : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'"
            >
              Alle
            </button>
            <button
              v-for="cat in listCategories"
              :key="cat.id"
              type="button"
              @click="activeCategoryId = activeCategoryId === cat.id ? null : cat.id"
              class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :style="cat.color
                ? activeCategoryId === cat.id
                  ? { backgroundColor: cat.color, color: '#fff' }
                  : { backgroundColor: cat.color + '33', color: cat.color }
                : {}"
              :class="!cat.color
                ? activeCategoryId === cat.id
                  ? 'bg-ctp-surface2 text-ctp-text'
                  : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'
                : ''"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Participant avatars (only shown when list has >1 participant) -->
      <ParticipantList :list-id="listId" @click-participant="selectedParticipant = $event" />

      <!-- Progress bar -->
      <div v-if="list && list.itemCount > 0" class="h-0.5 bg-ctp-surface0 mx-4 rounded-full overflow-hidden">
        <div
          class="h-full bg-ctp-teal rounded-full transition-all duration-500"
          :style="{ width: progressPct + '%' }"
        />
      </div>
    </div>

    <!-- Conflict banner -->
    <ConflictBanner :conflicts="conflicts" @dismiss="dismissConflicts" />

    <!-- Content -->
    <div class="max-w-lg mx-auto px-4 py-4 pb-32">
      <div v-if="itemsStore.loading" class="space-y-2 mt-2">
        <div v-for="n in 4" :key="n" class="h-12 bg-ctp-surface0 rounded-xl skeleton" />
      </div>

      <div v-else-if="itemsStore.error" class="text-center py-12 text-ctp-red text-sm">
        {{ itemsStore.error }}
      </div>

      <div
        v-else-if="items.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center gap-3"
      >
        <span class="text-5xl">🛒</span>
        <p class="text-ctp-subtext0 text-sm">Noch keine Items. Füge das erste hinzu!</p>
      </div>

      <template v-else>
        <!-- Budget bar (shown when any unchecked item has a price) -->
        <BudgetBar :list-id="listId" :items-version="itemsVersion" />

        <div v-if="filteredItems.length === 0" class="text-center py-12 text-ctp-subtext0 text-sm">
          Keine Items für „{{ searchQuery }}" gefunden.
        </div>

        <div v-else class="space-y-1">
          <!-- Unchecked -->
          <div class="group" v-for="item in filteredUncheckedItems" :key="item.id">
            <ItemRow
              :item="item"
              @toggle="onToggle(listId, $event)"
              @edit="startEdit"
              @delete="deleteItem"
            />
          </div>

          <!-- Divider -->
          <div v-if="filteredUncheckedItems.length > 0 && filteredCheckedItems.length > 0" class="flex items-center gap-3 py-2 px-4">
            <div class="flex-1 h-px bg-ctp-surface1" />
            <span class="text-xs text-ctp-overlay0">Erledigt</span>
            <div class="flex-1 h-px bg-ctp-surface1" />
          </div>

          <!-- Checked -->
          <div class="group" v-for="item in filteredCheckedItems" :key="item.id">
            <ItemRow
              :item="item"
              @toggle="onToggle(listId, $event)"
              @edit="startEdit"
              @delete="deleteItem"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- FAB -->
    <button
      @click="showAddSheet = true"
      class="fixed bottom-24 right-4 safe-bottom w-14 h-14 rounded-full bg-gradient-to-br from-ctp-teal to-ctp-sapphire shadow-lg flex items-center justify-center text-ctp-base active:scale-95 transition-transform z-20"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <AddItemSheet
      v-model="showAddSheet"
      :editing-item="editingItem"
      :list-id="listId"
      @submit="handleItemSubmit"
    />

    <ShareListModal
      v-if="list"
      v-model="showShareModal"
      :list="list"
      @token-changed="onTokenChanged"
    />

    <ParticipantSheet
      :participant="selectedParticipant"
      :items="items"
      @close="selectedParticipant = null"
    />

    <!-- Save as preset sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showSavePreset" class="fixed inset-0 z-50 flex flex-col justify-end">
          <div class="absolute inset-0 bg-ctp-crust/60 backdrop-blur-sm" @click="showSavePreset = false" />
          <div class="relative bg-ctp-mantle border-t border-ctp-surface0 rounded-t-3xl px-5 pt-4 pb-10 safe-bottom max-w-lg mx-auto w-full">
            <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-4" />
            <p class="text-base font-semibold text-ctp-text mb-4">Als Vorlage speichern</p>
            <input
              ref="presetNameRef"
              v-model="presetName"
              type="text"
              placeholder="Name der Vorlage…"
              maxlength="100"
              class="w-full px-4 py-3 rounded-xl bg-ctp-surface0 border border-ctp-surface1 text-ctp-text placeholder-ctp-overlay0 outline-none focus:border-ctp-teal focus:ring-2 focus:ring-ctp-teal/20 mb-4"
              @keydown.enter="doSavePreset"
            />
            <div v-if="presetSaved" class="mb-4 text-sm text-ctp-green flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Vorlage gespeichert
            </div>
            <div class="flex gap-3">
              <button @click="showSavePreset = false" class="flex-1 py-3 rounded-xl bg-ctp-surface0 text-ctp-subtext0 text-sm font-medium">Abbrechen</button>
              <button
                @click="doSavePreset"
                :disabled="!presetName.trim() || savingPreset"
                class="flex-1 py-3 rounded-xl bg-ctp-yellow text-ctp-base text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >{{ savingPreset ? 'Speichern…' : 'Speichern' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { useItemsStore } from '../stores/items'
import { usePresenceStore } from '../stores/presence'
import { useCategoriesStore } from '../stores/categories'
import { useListSync } from '../composables/useListSync'
import { exportService } from '../services/export'
import { presetService } from '../services/preset'
import ItemRow from '../components/item/ItemRow.vue'
import AddItemSheet from '../components/item/AddItemSheet.vue'
import BudgetBar from '../components/list/BudgetBar.vue'
import ConnectionBanner from '../components/common/ConnectionBanner.vue'
import ConflictBanner from '../components/list/ConflictBanner.vue'
import ParticipantList from '../components/list/ParticipantList.vue'
import ParticipantSheet from '../components/list/ParticipantSheet.vue'
import ShareListModal from '../components/list/ShareListModal.vue'
import type { Item, ParticipantResponse } from '../types'

const route = useRoute()
const router = useRouter()
const listId = route.params.id as string

const listsStore = useListsStore()
const itemsStore = useItemsStore()
const presenceStore = usePresenceStore()
const categoriesStore = useCategoriesStore()
const { connected: syncConnected, conflicts, dismissConflicts, startSync } = useListSync()

const list = computed(() => listsStore.getById(listId))
const items = computed(() => itemsStore.getItems(listId))
const listCategories = computed(() => categoriesStore.getForList(listId))

// Category filter — null means "all"
const activeCategoryId = ref<string | null>(null)

// Bumped after any create/update/toggle/delete so BudgetBar re-fetches
const itemsVersion = ref(0)

const showSearch = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const filteredItems = computed(() => {
  let result = items.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) result = result.filter(i => i.name.toLowerCase().includes(q))
  if (activeCategoryId.value !== null) result = result.filter(i => i.categoryId === activeCategoryId.value)
  return result
})
const filteredUncheckedItems = computed(() => filteredItems.value.filter(i => !i.checked))
const filteredCheckedItems = computed(() => filteredItems.value.filter(i => i.checked))

const onlineCount = computed(() => presenceStore.getCount(listId))
const progressPct = computed(() => {
  if (!list.value || list.value.itemCount === 0) return 0
  return Math.round((list.value.checkedCount / list.value.itemCount) * 100)
})

const showAddSheet = ref(false)
const showShareModal = ref(false)
const showExportMenu = ref(false)
const editingItem = ref<Item | null>(null)
const selectedParticipant = ref<ParticipantResponse | null>(null)

const showSavePreset = ref(false)
const presetName = ref('')
const presetNameRef = ref<HTMLInputElement | null>(null)
const savingPreset = ref(false)
const presetSaved = ref(false)

function openSavePreset() {
  presetName.value = list.value?.name ?? ''
  presetSaved.value = false
  showSavePreset.value = true
  nextTick(() => presetNameRef.value?.focus())
}

async function doSavePreset() {
  if (!presetName.value.trim() || savingPreset.value || !list.value) return
  savingPreset.value = true
  try {
    await presetService.create(presetName.value.trim(), list.value.emoji, listId)
    presetSaved.value = true
    setTimeout(() => { showSavePreset.value = false }, 1200)
  } catch {
    // ignore
  } finally {
    savingPreset.value = false
  }
}

async function doExport(format: 'csv' | 'pdf') {
  showExportMenu.value = false
  if (!list.value) return
  await exportService.download(listId, format, list.value.name)
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    nextTick(() => searchInputRef.value?.focus())
  } else {
    searchQuery.value = ''
  }
}

onMounted(async () => {
  if (!list.value) await listsStore.fetchAll()
  await itemsStore.fetchAll(listId)
  categoriesStore.fetchForList(listId)
  startSync(listId)
})

function onTokenChanged(token: string | null) {
  const l = listsStore.lists.find(l => l.id === listId)
  if (l) l.shareToken = token
}

function startEdit(item: Item) {
  editingItem.value = item
  showAddSheet.value = true
}

async function onToggle(lid: string, itemId: string) {
  await itemsStore.toggleCheck(lid, itemId)
  itemsVersion.value++
}

async function handleItemSubmit(payload: { name: string; quantity: number | null; quantityUnit: string | null; labelIds: string[]; categoryId: string | null; price: number | null; imageUrl: string | null }) {
  if (editingItem.value) {
    await itemsStore.update(listId, editingItem.value.id, {
      name: payload.name,
      quantity: payload.quantity,
      quantityUnit: payload.quantityUnit,
      labelIds: payload.labelIds,
      categoryId: payload.categoryId ?? undefined,
      price: payload.price,
      imageUrl: payload.imageUrl,
    })
    editingItem.value = null
  } else {
    await itemsStore.create(listId, {
      name: payload.name,
      quantity: payload.quantity,
      quantityUnit: payload.quantityUnit,
      labelIds: payload.labelIds,
      categoryId: payload.categoryId ?? undefined,
      price: payload.price,
      imageUrl: payload.imageUrl,
    })
  }
  itemsVersion.value++
}

async function deleteItem(itemId: string) {
  await itemsStore.remove(listId, itemId)
  itemsVersion.value++
}
</script>

<style scoped>
.search-enter-active,
.search-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.search-enter-from,
.search-leave-to {
  opacity: 0;
  max-height: 0;
  padding-bottom: 0;
}
.search-enter-to,
.search-leave-from {
  opacity: 1;
  max-height: 60px;
}
.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease; }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); opacity: 0; }
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
