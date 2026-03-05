<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import ListSection from '../components/list/ListSection.vue'
import ListCard from '../components/list/ListCard.vue'
import FloatingActionButton from '../components/common/FloatingActionButton.vue'
import AddListModal from '../components/common/AddListModal.vue'
import LinkDevicesModal from '../components/list/LinkDevicesModal.vue'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const showAddModal = ref(false)
const showLinkModal = ref(false)

const initialPresetId = ref<string | null>(null)
const initialPresetEmoji = ref<string | null>(null)
const initialPresetName = ref<string | null>(null)

onMounted(() => listsStore.fetchAll())

// Open AddListModal pre-filled when coming from LibraryView via query params
watch(() => route.query, (q) => {
  if (q.presetId) {
    initialPresetId.value = q.presetId as string
    initialPresetEmoji.value = (q.presetEmoji as string) || null
    initialPresetName.value = (q.presetName as string) || null
    showAddModal.value = true
    router.replace({ name: 'home' })
  }
}, { immediate: true })

const lists = computed(() => listsStore.lists)
const totalDone = computed(() => lists.value.reduce((a, l) => a + l.checkedCount, 0))
const totalRemaining = computed(() => lists.value.reduce((a, l) => a + (l.itemCount - l.checkedCount), 0))
const sharedCount = computed(() => lists.value.filter(l => l.participantCount > 1).length)

async function handleCreate(name: string, emoji: string, presetId: string | null) {
  await listsStore.create({ name, emoji, presetId })
}
</script>

<template>
  <div class="pt-16 pb-24 px-5 max-w-lg mx-auto">
    <!-- Greeting -->
    <div class="mt-4 mb-6 animate-fade-up flex items-start justify-between">
      <div>
        <p class="text-ctp-overlay1 text-sm">Willkommen zurück</p>
        <h2 class="text-2xl font-bold text-ctp-text mt-0.5">
          Deine Listen
          <span class="text-ctp-overlay0 font-normal text-base ml-1">
            ({{ lists.length }})
          </span>
        </h2>
      </div>
      <!-- Link devices button -->
      <button
        @click="showLinkModal = true"
        class="mt-1 p-2 rounded-xl text-ctp-subtext0 hover:text-ctp-teal hover:bg-ctp-surface0 transition-colors"
        aria-label="Geräte verknüpfen"
        title="Geräte verknüpfen"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-3 gap-3 mb-8 animate-fade-up" style="animation-delay: 60ms">
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-green tabular-nums">{{ totalDone }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Erledigt</p>
      </div>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-teal tabular-nums">{{ totalRemaining }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Offen</p>
      </div>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-3 text-center">
        <p class="text-xl font-bold text-ctp-sapphire tabular-nums">{{ sharedCount }}</p>
        <p class="text-[10px] text-ctp-overlay0 mt-0.5 uppercase tracking-wider">Geteilt</p>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="listsStore.loading" class="space-y-3 animate-fade-up">
      <div v-for="n in 3" :key="n" class="h-24 bg-ctp-surface0 rounded-2xl skeleton" />
    </div>

    <!-- Error -->
    <div v-else-if="listsStore.error" class="text-center py-12 text-ctp-red text-sm animate-fade-up">
      {{ listsStore.error }}
    </div>

    <!-- Lists -->
    <template v-else>
      <ListSection title="Meine Listen" :count="lists.length" class="mb-8">
        <ListCard
          v-for="(list, i) in lists"
          :key="list.id"
          :list="list"
          :index="i"
        />

        <div v-if="lists.length === 0" class="text-center py-12 animate-fade-up">
          <p class="text-4xl mb-3">🛒</p>
          <p class="text-ctp-overlay0 text-sm">Noch keine Listen. Erstelle deine erste!</p>
        </div>
      </ListSection>
    </template>

    <!-- FAB -->
    <FloatingActionButton @click="showAddModal = true" />

    <!-- Add modal -->
    <AddListModal
      :open="showAddModal"
      :initial-preset-id="initialPresetId"
      :initial-preset-emoji="initialPresetEmoji"
      :initial-preset-name="initialPresetName"
      @close="showAddModal = false"
      @create="handleCreate"
    />

    <!-- Link devices modal -->
    <LinkDevicesModal v-model="showLinkModal" />
  </div>
</template>
