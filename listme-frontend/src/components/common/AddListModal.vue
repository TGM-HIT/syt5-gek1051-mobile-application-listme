<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { presetService, type Preset } from '../../services/preset'
import { emojiGroups, DEFAULT_RECENT_EMOJIS } from '../../utils/emojis'

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

const RECENTS_KEY = 'listme-recent-emojis'
const MAX_RECENTS = 12

function loadRecents(): string[] {
  try {
    const stored = localStorage.getItem(RECENTS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return [...DEFAULT_RECENT_EMOJIS]
}

function saveRecents(list: string[]) {
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

const name = ref('')
const selectedEmoji = ref('')
const selectedPresetId = ref<string | null>(null)
const selectedPresetName = ref<string | null>(null)
const inputRef = ref<HTMLInputElement>()
const presets = ref<Preset[]>([])
const showEmojiPicker = ref(false)
const recentEmojis = ref<string[]>(loadRecents())

function pickEmoji(emoji: string) {
  selectedEmoji.value = emoji
  showEmojiPicker.value = false
  const updated = [emoji, ...recentEmojis.value.filter(e => e !== emoji)].slice(0, MAX_RECENTS)
  recentEmojis.value = updated
  saveRecents(updated)
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    name.value = ''
    selectedEmoji.value = props.initialPresetEmoji || recentEmojis.value[0] || DEFAULT_RECENT_EMOJIS[0]!
    selectedPresetId.value = props.initialPresetId ?? null
    selectedPresetName.value = props.initialPresetName ?? null
    showEmojiPicker.value = false
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
        <div class="bg-ctp-mantle border-t border-ctp-surface0 rounded-t-3xl p-6 shadow-2xl shadow-ctp-crust/50 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
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
          <div class="mb-5">
            <!-- Recent emojis row -->
            <div class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="emoji in recentEmojis"
                :key="emoji"
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 border-2"
                :class="selectedEmoji === emoji ? 'bg-ctp-teal/10 border-ctp-teal scale-110' : 'bg-ctp-surface0 border-transparent hover:bg-ctp-surface1'"
                @click="pickEmoji(emoji)"
              >{{ emoji }}</button>

              <!-- More emojis toggle -->
              <button
                class="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-medium transition-all duration-150 border-2"
                :class="showEmojiPicker ? 'bg-ctp-teal/10 border-ctp-teal text-ctp-teal' : 'bg-ctp-surface0 border-transparent text-ctp-subtext0 hover:bg-ctp-surface1'"
                aria-label="Mehr Symbole"
                @click="showEmojiPicker = !showEmojiPicker"
              >+</button>
            </div>

            <!-- Expanded emoji picker grouped by category -->
            <div v-if="showEmojiPicker" class="rounded-xl bg-ctp-surface0 p-2 max-h-52 overflow-y-auto">
              <div v-for="group in emojiGroups" :key="group.group" class="mb-2">
                <p class="text-[10px] font-medium text-ctp-overlay0 uppercase tracking-wide px-1 pb-1">{{ group.group }}</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="emoji in group.emojis"
                    :key="emoji"
                    class="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-150"
                    :class="selectedEmoji === emoji ? 'bg-ctp-teal/20 scale-110' : 'hover:bg-ctp-surface1'"
                    @click="pickEmoji(emoji)"
                  >{{ emoji }}</button>
                </div>
              </div>
            </div>
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
