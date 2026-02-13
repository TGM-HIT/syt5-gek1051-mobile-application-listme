<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  create: [name: string, emoji: string]
}>()

const name = ref('')
const selectedEmoji = ref('')
const inputRef = ref<HTMLInputElement>()

const emojis = ['🛒', '🏠', '🎂', '🎁', '💊', '🐾', '🧹', '🍕', '📦', '🌿', '🏋️', '✈️']

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    name.value = ''
    selectedEmoji.value = '🛒'
    await nextTick()
    inputRef.value?.focus()
  }
})

function handleCreate() {
  if (!name.value.trim()) return
  emit('create', name.value.trim(), selectedEmoji.value)
  emit('close')
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-ctp-crust/60 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Bottom Sheet -->
    <Transition name="sheet">
      <div
        v-if="open"
        class="fixed bottom-0 left-0 right-0 z-50"
        :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
      >
        <div class="bg-ctp-mantle border-t border-ctp-surface0 rounded-t-3xl p-6 shadow-2xl shadow-ctp-crust/50 max-w-lg mx-auto">
          <!-- Drag handle -->
          <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-5" />

          <h2 class="text-lg font-semibold text-ctp-text mb-5">New List</h2>

          <!-- Name input -->
          <div class="relative mb-5">
            <input
              ref="inputRef"
              v-model="name"
              type="text"
              placeholder="List name..."
              maxlength="50"
              class="
                w-full px-4 py-3 rounded-xl
                bg-ctp-surface0 border border-ctp-surface1
                text-ctp-text placeholder-ctp-overlay0
                outline-none
                transition-all duration-200
                focus:border-ctp-teal focus:ring-2 focus:ring-ctp-teal/20
              "
              @keydown.enter="handleCreate"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ctp-overlay0 tabular-nums">
              {{ name.length }}/50
            </span>
          </div>

          <!-- Emoji picker -->
          <p class="text-xs font-medium text-ctp-subtext0 mb-2.5">Choose an icon</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              class="
                w-10 h-10 rounded-xl flex items-center justify-center text-lg
                transition-all duration-150
                border-2
              "
              :class="selectedEmoji === emoji
                ? 'bg-ctp-teal/10 border-ctp-teal scale-110'
                : 'bg-ctp-surface0 border-transparent hover:bg-ctp-surface1'"
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="
                flex-1 py-3 rounded-xl
                bg-ctp-surface0 text-ctp-subtext0
                font-medium text-sm
                transition-colors duration-150
                hover:bg-ctp-surface1
                active:scale-[0.98]
              "
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              class="
                flex-1 py-3 rounded-xl
                bg-gradient-to-r from-ctp-teal to-ctp-sapphire
                text-ctp-crust font-semibold text-sm
                transition-all duration-150
                hover:shadow-lg hover:shadow-ctp-teal/30
                active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              :disabled="!name.trim()"
              @click="handleCreate"
            >
              Create List
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
