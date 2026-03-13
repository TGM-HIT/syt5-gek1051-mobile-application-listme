<script setup lang="ts">
import type { Conflict } from '../../crdt/ConflictDetector'

const props = defineProps<{ conflicts: Conflict[] }>()
const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <Transition name="banner">
    <div
      v-if="conflicts.length > 0"
      class="mx-4 mt-2 flex items-start gap-3 bg-ctp-yellow/10 border border-ctp-yellow/25 rounded-xl px-4 py-3"
    >
      <span class="text-ctp-yellow text-base shrink-0 mt-0.5">⚡</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-ctp-yellow">
          {{ conflicts.length }} gleichzeitige {{ conflicts.length === 1 ? 'Änderung' : 'Änderungen' }} erkannt
        </p>
        <p class="text-xs text-ctp-yellow/70 mt-0.5">
          Automatisch zusammengeführt — neueste Änderung hat Vorrang.
        </p>
      </div>
      <button
        @click="emit('dismiss')"
        class="text-ctp-yellow/60 hover:text-ctp-yellow transition-colors shrink-0"
        aria-label="Schließen"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.25s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
