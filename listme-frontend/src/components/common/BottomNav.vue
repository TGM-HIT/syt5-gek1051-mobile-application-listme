<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getOrCreateUserId } from '../../services/userId'

const router = useRouter()
const route = useRoute()

const tabs = [
  { id: 'home', label: 'Listen', icon: 'lists' },
  { id: 'library', label: 'Bibliothek', icon: 'library' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings' },
] as const

const active = computed(() => {
  if (route.name === 'home') return 'home'
  if (route.name === 'library') return 'library'
  if (route.name === 'settings') return 'settings'
  return null
})

function onTab(tab: typeof tabs[number]) {
  if (tab.id === 'home') router.push(`/${getOrCreateUserId()}`)
  else if (tab.id === 'library') router.push('/library')
  else if (tab.id === 'settings') router.push('/settings')
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-ctp-mantle/80 backdrop-blur-xl border-t border-ctp-surface0/50"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <div class="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="pressable flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors duration-200 min-w-[64px] relative"
        :class="active === tab.id
          ? 'text-ctp-teal'
          : 'text-ctp-overlay0 hover:text-ctp-subtext0'"
        @click="onTab(tab)"
      >
        <!-- Lists icon -->
        <svg v-if="tab.icon === 'lists'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>

        <!-- Library icon -->
        <svg v-if="tab.icon === 'library'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4v16" />
          <path d="M8 4v16" />
          <path d="M12 4v16" />
          <path d="M16 6l4 14" />
        </svg>

        <!-- Settings icon -->
        <svg v-if="tab.icon === 'settings'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>

        <span class="text-[10px] font-medium leading-none">{{ tab.label }}</span>

        <!-- Active indicator dot -->
        <div
          class="absolute -top-0.5 w-1 h-1 rounded-full bg-ctp-teal transition-opacity duration-200"
          :class="active === tab.id ? 'opacity-100' : 'opacity-0'"
        />
      </button>
    </div>
  </nav>
</template>
