<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { subscribeToPush } from '../../services/pushNotification'

const show = ref(false)
const loading = ref(false)

onMounted(() => {
  if (!('Notification' in window) || !('PushManager' in window)) return
  // Only show the banner if permission hasn't been decided yet
  if (Notification.permission === 'default') {
    show.value = true
  }
})

async function enable() {
  loading.value = true
  try {
    await subscribeToPush()
  } finally {
    loading.value = false
    show.value = false
  }
}

function dismiss() {
  show.value = false
}
</script>

<template>
  <Transition name="banner">
    <div
      v-if="show"
      class="fixed top-14 left-0 right-0 z-40 flex items-center gap-3 px-4 py-2.5 text-xs
             bg-ctp-surface0 border-b border-ctp-surface1 shadow-sm"
    >
      <span class="text-base">🔔</span>
      <span class="flex-1 text-ctp-subtext1">
        Benachrichtigungen aktivieren, um informiert zu werden wenn jemand Artikel abhakt oder entfernt.
      </span>
      <button
        class="shrink-0 px-3 py-1 rounded-lg bg-ctp-green/20 text-ctp-green text-xs font-medium
               disabled:opacity-50"
        :disabled="loading"
        @click="enable"
      >
        {{ loading ? '…' : 'Aktivieren' }}
      </button>
      <button
        class="shrink-0 text-ctp-overlay1 hover:text-ctp-text px-1"
        @click="dismiss"
        aria-label="Schließen"
      >
        ✕
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
  transform: translateY(-100%);
}
</style>
