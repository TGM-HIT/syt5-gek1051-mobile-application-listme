<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { presetService, type Preset } from '../../services/preset'

const props = defineProps<{
  open: boolean
  initialPresetId?: string | null
  initialPresetEmoji?: string | null
  initialPresetName?: string | null
}>()

const emit = defineEmits<{
  close: []
  create: [name: string, emoji: string, presetId: string | null]
}>()

const name = ref('')
const selectedEmoji = ref('')
const selectedPresetId = ref<string | null>(null)
const selectedPresetName = ref<string | null>(null)
const inputRef = ref<HTMLInputElement>()
const presets = ref<Preset[]>([])

const emojis = ['🛒', '🏠', '🎂', '🎁', '💊', '🐾', '🧹', '🍕', '📦', '🌿', '🏋️', '✈️']

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    name.value = ''
    selectedEmoji.value = props.initialPresetEmoji || emojis[0]!
    selectedPresetId.value = props.initialPresetId ?? null
    selectedPresetName.value = props.initialPresetName ?? null
    await nextTick()
    inputRef.value?.focus()
    presetService.getAll().then(p => { presets.value = p }).catch(() => {})
  }
}, { immediate: true })

function selectPreset(preset: Preset | null) {
  if (preset === null) {
    selectedPresetId.value = null
    selectedPresetName.value = null
  } else {
    selectedPresetId.value = preset.id
    selectedPresetName.value = preset.name
    selectedEmoji.value = preset.emoji
  }
}

function handleCreate() {
  if (!name.value.trim()) return
  emit('create', name.value.trim(), selectedEmoji.value, selectedPresetId.value)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="open" class="fixed inset-0 z-50 bg-ctp-crust/60 backdrop-blur-sm" @click="$emit('close')" />
    </Transition>

    <Transition name="sheet">
      <div v-if="open" class="fixed bottom-0 left-0 right-0 z-50" :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }">
        <div class="bg-ctp-mantle border-t border-ctp-surface0 rounded-t-3xl p-6 shadow-2xl shadow-ctp-crust/50 max-w-lg mx-auto">
          <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-5" />

          <h2 class="text-lg font-semibold text-ctp-text mb-5">Neue Liste</h2>

          <!-- Name -->
          <div class="relative mb-5">
            <input
              ref="inputRef"
              v-model="name"
              type="text"
              placeholder="Name der Liste…"
              maxlength="50"
              class="w-full px-4 py-3 rounded-xl bg-ctp-surface0 border border-ctp-surface1 text-ctp-text placeholder-ctp-overlay0 outline-none transition-all duration-200 focus:border-ctp-teal focus:ring-2 focus:ring-ctp-teal/20"
              @keydown.enter="handleCreate"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ctp-overlay0 tabular-nums">{{ name.length }}/50</span>
          </div>

          <!-- Emoji -->
          <p class="text-xs font-medium text-ctp-subtext0 mb-2.5">Symbol</p>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 border-2"
              :class="selectedEmoji === emoji ? 'bg-ctp-teal/10 border-ctp-teal scale-110' : 'bg-ctp-surface0 border-transparent hover:bg-ctp-surface1'"
              @click="selectedEmoji = emoji"
            >{{ emoji }}</button>
          </div>

          <!-- Preset picker -->
          <div v-if="presets.length > 0" class="mb-5">
            <p class="text-xs font-medium text-ctp-subtext0 mb-2.5">
              Von Vorlage starten <span class="font-normal text-ctp-overlay0">(optional)</span>
            </p>
            <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                @click="selectPreset(null)"
                class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                :class="selectedPresetId === null
                  ? 'bg-ctp-surface1 border-ctp-surface2 text-ctp-text'
                  : 'bg-ctp-surface0 border-transparent text-ctp-overlay0 hover:text-ctp-subtext0'"
              >Leer</button>
              <button
                v-for="preset in presets"
                :key="preset.id"
                @click="selectPreset(preset)"
                class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                :class="selectedPresetId === preset.id
                  ? 'bg-ctp-teal/10 border-ctp-teal text-ctp-teal'
                  : 'bg-ctp-surface0 border-transparent text-ctp-subtext0 hover:bg-ctp-surface1'"
              >
                <span>{{ preset.emoji }}</span>
                {{ preset.name }}
                <span class="opacity-50">· {{ preset.itemCount }}</span>
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-xl bg-ctp-surface0 text-ctp-subtext0 font-medium text-sm transition-colors hover:bg-ctp-surface1 active:scale-[0.98]"
              @click="$emit('close')"
            >Abbrechen</button>
            <button
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-ctp-teal to-ctp-sapphire text-ctp-crust font-semibold text-sm transition-all hover:shadow-lg hover:shadow-ctp-teal/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!name.trim()"
              @click="handleCreate"
            >{{ selectedPresetId ? `Aus Vorlage` : 'Erstellen' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.3s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
.sheet-enter-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sheet-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
