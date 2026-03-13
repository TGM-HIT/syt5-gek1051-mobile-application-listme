<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="
      fixed z-50 w-14 h-14 rounded-2xl
      bg-gradient-to-br from-ctp-teal to-ctp-sapphire
      shadow-lg shadow-ctp-teal/30
      flex items-center justify-center
      transition-all duration-300 ease-out
      hover:shadow-xl hover:shadow-ctp-teal/40 hover:scale-105
      active:scale-95 active:shadow-md
      animate-scale-in
    "
    style="bottom: calc(5rem + env(safe-area-inset-bottom)); right: 1.25rem;"
    aria-label="Liste erstellen"
    @click="$emit('click')"
  >
    <!-- Pulse ring -->
    <span class="absolute inset-0 rounded-2xl bg-ctp-teal/30 animate-[pulse-ring_2s_ease-out_infinite]" />

    <svg class="w-6 h-6 text-ctp-crust relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
</template>
