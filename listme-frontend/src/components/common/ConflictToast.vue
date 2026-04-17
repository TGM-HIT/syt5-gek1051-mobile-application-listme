<template>
  <Teleport to="body">
    <div class="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      <TransitionGroup name="toast">
        <div
          v-for="n in store.notifications"
          :key="n.id"
          class="pointer-events-auto w-full max-w-sm bg-ctp-surface0 border border-ctp-yellow/30 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3"
        >
          <span class="text-ctp-yellow text-lg shrink-0">⚠</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ctp-text">Konflikt automatisch gelöst</p>
            <p class="text-xs text-ctp-subtext0 truncate">„{{ n.listName }}"</p>
          </div>
          <button
            @click="store.dismiss(n.id)"
            class="shrink-0 text-ctp-overlay0 hover:text-ctp-text transition-colors"
            aria-label="Schließen"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useNotificationsStore } from '../../stores/notifications'

const store = useNotificationsStore()

// Auto-dismiss each notification after 6 s
watch(
  () => store.notifications.length,
  () => {
    const oldest = store.notifications[0]
    if (!oldest) return
    const age = Date.now() - oldest.ts
    const delay = Math.max(0, 6000 - age)
    setTimeout(() => store.dismiss(oldest.id), delay)
  },
)

onMounted(() => {
  // Dismiss any stale notifications on mount
  store.dismissAll()
})
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateY(12px); }
</style>
