<script setup lang="ts">
defineProps<{
  title: string
  count: number
}>()
</script>

<template>
  <section class="animate-fade-up">
    <div class="flex items-center justify-between mb-3 px-1">
      <h2 class="text-sm font-semibold text-ctp-subtext0 uppercase tracking-wider">
        {{ title }}
      </h2>
      <span class="text-xs font-medium text-ctp-overlay0 bg-ctp-surface0 px-2 py-0.5 rounded-full">
        {{ count }}
      </span>
    </div>

    <div class="flex flex-col gap-3">
      <slot />
    </div>
  </section>
</template>
