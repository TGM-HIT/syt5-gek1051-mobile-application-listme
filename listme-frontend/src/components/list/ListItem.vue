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
      class="form-checkbox h-5 w-5 text-ctp-teal rounded border-ctp-surface2 focus:ring-ctp-teal"
    />
    <span :class="{ 'line-through text-ctp-overlay0': item.checked }" class="text-ctp-text flex-1">
      {{ item.name }}
    </span>
  </div>
</template>
