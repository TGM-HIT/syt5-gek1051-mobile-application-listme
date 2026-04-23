<template>
  <Teleport to="body">
    <Transition name="snackbar">
      <div
        v-if="show"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium shadow-lg shadow-ctp-crust/30 whitespace-nowrap"
        :class="bannerClass"
      >
        <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="dotClass" />
        <span>{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useOffline } from '../../composables/useOffline'
import { reconnectAttempt } from '../../services/websocket'

const props = defineProps<{ connected: boolean }>()

const { isOnline } = useOffline()

const show = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const UNREACHABLE_THRESHOLD = 5

const status = computed<'offline' | 'syncing' | 'unreachable' | 'connected'>(() => {
  if (!isOnline.value) return 'offline'
  if (!props.connected) {
    return reconnectAttempt.value >= UNREACHABLE_THRESHOLD ? 'unreachable' : 'syncing'
  }
  return 'connected'
})

const bannerClass = computed(() => ({
  'bg-ctp-red/90 text-ctp-base': status.value === 'offline' || status.value === 'unreachable',
  'bg-ctp-surface1 text-ctp-yellow border border-ctp-yellow/30': status.value === 'syncing',
  'bg-ctp-green/90 text-ctp-base': status.value === 'connected',
}))

const dotClass = computed(() => ({
  'bg-ctp-base': status.value === 'offline' || status.value === 'unreachable' || status.value === 'connected',
  'bg-ctp-yellow animate-pulse': status.value === 'syncing',
}))

const message = computed(() => {
  if (status.value === 'offline') return 'Kein Internet — Offline gespeichert'
  if (status.value === 'unreachable') return 'Server nicht erreichbar — Offline gespeichert'
  if (status.value === 'syncing') {
    return reconnectAttempt.value > 0
      ? `Erneut verbinden… Versuch ${reconnectAttempt.value}`
      : 'Verbindung wird hergestellt…'
  }
  return 'Verbunden'
})

onMounted(() => {
  if (status.value !== 'connected') show.value = true
})

watch(status, (next, prev) => {
  if (hideTimeout) clearTimeout(hideTimeout)
  show.value = true
  if (next === 'connected' && prev !== 'connected') {
    hideTimeout = setTimeout(() => { show.value = false }, 2000)
  }
})
</script>

<style scoped>
.snackbar-enter-active,
.snackbar-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.snackbar-enter-from,
.snackbar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
