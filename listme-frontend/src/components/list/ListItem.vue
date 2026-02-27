<script setup lang="ts">
import type { Item } from '../../types'

const props = defineProps<{
  item: Item
}>()

const emit = defineEmits(['toggle-check'])

function toggleCheck() {
  emit('toggle-check', props.item.id)
}
</script>

<template>
  <div class="flex items-center gap-3 p-3 bg-ctp-surface0/60 rounded-lg border border-ctp-surface1">
    <input
      type="checkbox"
      :checked="item.checked"
      @change="toggleCheck"
      class="round-checkbox text-ctp-teal border-ctp-surface2"
    />
    <span :class="{ 'line-through text-ctp-overlay0': item.checked }" class="text-ctp-text flex-1">
      {{ item.name }}
    </span>
  </div>
</template>
