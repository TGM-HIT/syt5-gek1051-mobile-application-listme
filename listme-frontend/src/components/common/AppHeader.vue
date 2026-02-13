<script setup lang="ts">
import { ref, onMounted } from 'vue'

const scrolled = ref(false)

onMounted(() => {
  const el = document.querySelector('.main-scroll')
  if (el) {
    el.addEventListener('scroll', () => {
      scrolled.value = el.scrollTop > 8
    })
  }
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
    :class="scrolled
      ? 'bg-ctp-mantle/80 backdrop-blur-xl border-b border-ctp-surface0/50 shadow-lg shadow-ctp-crust/20'
      : 'bg-transparent'"
    :style="{ paddingTop: 'env(safe-area-inset-top)' }"
  >
    <div class="flex items-center justify-between px-5 h-14">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-ctp-teal to-ctp-sapphire flex items-center justify-center shadow-lg shadow-ctp-teal/20">
          <svg class="w-4 h-4 text-ctp-crust" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-ctp-text tracking-tight">ListMe</h1>
      </div>

      <!-- Avatar -->
      <button class="pressable w-9 h-9 rounded-full bg-ctp-surface0 border border-ctp-surface1 flex items-center justify-center">
        <span class="text-xs font-semibold text-ctp-subtext0">OG</span>
      </button>
    </div>
  </header>
</template>
