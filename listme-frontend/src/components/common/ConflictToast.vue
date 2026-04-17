<template>
  <Teleport to="body">
    <div class="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      <TransitionGroup name="toast">
        <div
          v-for="n in store.notifications"
          :key="n.id"
          class="pointer-events-auto w-full max-w-sm bg-ctp-surface0 border border-ctp-teal/30 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3"
        >
          <span class="text-ctp-teal text-lg shrink-0">🔔</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ctp-text truncate">„{{ n.listName }}"</p>
            <p class="text-xs text-ctp-subtext0">{{ n.message }}</p>
          </div>
          <button
            @click="store.dismiss(n.id)"
            class="shrink-0 text-ctp-teal hover:text-ctp-green transition-colors"
            aria-label="Bestätigen"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '../../stores/notifications'

const store = useNotificationsStore()

onMounted(() => {
  store.dismissAll()
})
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateY(12px); }
</style>
