<script setup lang="ts">
import type { Label } from '../../types'

defineProps<{ label: Label }>()
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
    :style="label.color
      ? { backgroundColor: label.color + '33', color: label.color }
      : {}"
    :class="!label.color ? 'bg-ctp-surface1 text-ctp-subtext0' : ''"
  >
    {{ label.name }}
  </span>
</template>
