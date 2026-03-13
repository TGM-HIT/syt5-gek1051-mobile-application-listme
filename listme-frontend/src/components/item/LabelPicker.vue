<script setup lang="ts">
import type { Label } from '../../types'

const props = defineProps<{
  labels: Label[]
  selectedIds: string[]
}>()
const emit = defineEmits<{ 'update:selectedIds': [ids: string[]] }>()

function toggle(id: string) {
  const current = [...props.selectedIds]
  const idx = current.indexOf(id)
  if (idx === -1) {
    current.push(id)
  } else {
    current.splice(idx, 1)
  }
  emit('update:selectedIds', current)
}
</script>

<template>
  <div v-if="labels.length > 0" class="flex flex-wrap gap-1.5">
    <button
      v-for="label in labels"
      :key="label.id"
      type="button"
      @click="toggle(label.id)"
      class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
      :style="label.color
        ? selectedIds.includes(label.id)
          ? { backgroundColor: label.color, color: '#fff' }
          : { backgroundColor: label.color + '33', color: label.color }
        : {}"
      :class="!label.color
        ? selectedIds.includes(label.id)
          ? 'bg-ctp-surface2 text-ctp-text'
          : 'bg-ctp-surface0 text-ctp-subtext0'
        : ''"
    >
      {{ label.name }}
    </button>
  </div>
</template>
