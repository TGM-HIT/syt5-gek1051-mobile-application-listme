<template>
  <Teleport to="body">
    <div class="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">

      <!-- Notifications — scrollable when many stack up -->
      <div class="w-full flex flex-col items-center gap-2 overflow-y-auto max-h-[55vh] pointer-events-none">
        <TransitionGroup name="toast">
          <div
            v-for="n in store.notifications"
            :key="n.id"
            class="pointer-events-auto w-full max-w-sm bg-ctp-surface0 border border-ctp-teal/30 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
          >
            <!-- Bell icon -->
            <div class="shrink-0 w-8 h-8 rounded-xl bg-ctp-teal/15 flex items-center justify-center">
              <svg class="w-4 h-4 text-ctp-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <!-- Text -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-ctp-teal truncate">{{ n.listName }}</p>
              <p class="text-xs text-ctp-subtext1 leading-tight">{{ n.message }}</p>
            </div>
            <!-- Check button -->
            <button
              @click="store.dismiss(n.id)"
              class="shrink-0 w-8 h-8 rounded-xl bg-ctp-teal/15 hover:bg-ctp-teal/30 flex items-center justify-center text-ctp-teal transition-colors"
              aria-label="Bestätigen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </TransitionGroup>
      </div>

      <!-- Clear-all pill — always at the bottom so it's reachable with many toasts -->
      <Transition name="toast">
        <button
          v-if="store.notifications.length > 1"
          key="clear-all"
          @click="store.dismissAll()"
          class="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ctp-surface1 border border-ctp-surface2 shadow-lg text-ctp-subtext0 text-xs font-medium hover:text-ctp-text hover:bg-ctp-surface2 transition-colors"
          aria-label="Alle Benachrichtigungen löschen"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Alle löschen ({{ store.notifications.length }})
        </button>
      </Transition>
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
