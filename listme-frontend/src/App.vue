<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import BottomNav from './components/common/BottomNav.vue'
import { useOffline } from './composables/useOffline'
import { useSyncQueue } from './composables/useSyncQueue'

const route = useRoute()
const { isOnline } = useOffline()

// Flush queued ops whenever connectivity returns
useSyncQueue()

const hideChrome = computed(() => !!route.meta.hideChrome)

// Show/hide the global offline banner
const showOfflineBanner = ref(!isOnline.value)
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(isOnline, (online) => {
  if (hideTimer) clearTimeout(hideTimer)
  showOfflineBanner.value = true
  if (online) {
    hideTimer = setTimeout(() => { showOfflineBanner.value = false }, 2500)
  }
})

const offlineBannerClass = computed(() =>
  isOnline.value
    ? 'bg-ctp-green/15 text-ctp-green border-b border-ctp-green/20'
    : 'bg-ctp-red/15 text-ctp-red border-b border-ctp-red/20'
)
</script>

<template>
  <div class="min-h-dvh bg-ctp-base text-ctp-text">
    <AppHeader v-if="!hideChrome" />

    <!-- Global offline / back-online banner (home + other non-list pages) -->
    <Transition name="banner">
      <div
        v-if="showOfflineBanner && !hideChrome"
        class="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium"
        :class="offlineBannerClass"
      >
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="isOnline ? 'bg-ctp-green animate-pulse' : 'bg-ctp-red'"
        />
        <span v-if="isOnline">Wieder online — Listen werden aktualisiert</span>
        <span v-else>Kein Internet — Offline-Daten werden angezeigt</span>
      </div>
    </Transition>

    <main class="main-scroll h-dvh overflow-y-auto overscroll-contain">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <BottomNav v-if="!hideChrome" />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease;
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from {
  opacity: 0;
}
.page-leave-to {
  opacity: 0;
}
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
