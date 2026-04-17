<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import BottomNav from './components/common/BottomNav.vue'
import ConflictToast from './components/common/ConflictToast.vue'
import { useOffline } from './composables/useOffline'
import { useSyncQueue } from './composables/useSyncQueue'
import { usePullToRefresh } from './composables/usePullToRefresh'
import { pushService } from './services/push'

const route = useRoute()
const { isOnline } = useOffline()

// Flush queued ops whenever connectivity returns
useSyncQueue()

// Request push permission + subscribe after first meaningful interaction
onMounted(() => {
  // Small delay so the page settles before the permission prompt appears
  setTimeout(() => pushService.init(), 3000)
})

const hideChrome = computed(() => !!route.meta.hideChrome)

// Pull-to-refresh
const { pullY, isRefreshing, attach } = usePullToRefresh(
  () => document.querySelector<HTMLElement>('.main-scroll'),
  () => window.location.reload(),
)

onMounted(attach)

const ptrTranslate = computed(() => `translateY(${pullY.value}px)`)
const ptrIndicatorY = computed(() => `${pullY.value - 44}px`)
const ptrRotation = computed(() => {
  const progress = Math.min(pullY.value / 32, 1)
  return `rotate(${progress * 180}deg)`
})

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

    <!-- Pull-to-refresh indicator -->
    <Transition name="ptr">
      <div
        v-if="pullY > 0 || isRefreshing"
        class="fixed left-1/2 -translate-x-1/2 z-50 w-9 h-9 rounded-full bg-ctp-surface1 border border-ctp-surface2 shadow-lg flex items-center justify-center pointer-events-none"
        :style="{ top: ptrIndicatorY }"
      >
        <!-- Spinner while refreshing -->
        <svg v-if="isRefreshing" class="w-4.5 h-4.5 text-ctp-teal animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
        </svg>
        <!-- Arrow while pulling -->
        <svg v-else class="w-4.5 h-4.5 text-ctp-teal transition-transform duration-100" :style="{ transform: ptrRotation }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>
    </Transition>

    <main
      class="main-scroll h-dvh overflow-y-auto overscroll-contain"
      :style="pullY > 0 ? { transform: ptrTranslate, transition: 'none' } : { transform: 'none', transition: 'transform 0.25s ease' }"
    >
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <BottomNav v-if="!hideChrome" />
    <ConflictToast />
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
.ptr-enter-active,
.ptr-leave-active {
  transition: opacity 0.2s ease;
}
.ptr-enter-from,
.ptr-leave-to {
  opacity: 0;
}
</style>
