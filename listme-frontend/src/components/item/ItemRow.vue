<template>
  <div
    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 pressable"
    :class="item.checked ? 'opacity-50' : ''"
  >
    <!-- Checkbox -->
    <button
      @click="emit('toggle', item.id)"
      :aria-label="item.checked ? 'Als offen markieren' : 'Artikel erledigen'"
      class="flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
      :class="item.checked
        ? 'bg-ctp-green border-ctp-green'
        : 'border-ctp-surface2 hover:border-ctp-green'"
    >
      <svg v-if="item.checked" class="w-3.5 h-3.5 text-ctp-base" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Name + category + quantity + price + labels -->
    <div class="flex-1 min-w-0">
      <span
        class="text-sm font-medium text-ctp-text truncate block transition-all duration-200"
        :class="item.checked ? 'line-through text-ctp-overlay1' : ''"
      >
        {{ item.name }}
      </span>
      <div v-if="item.categoryName || item.quantity || item.price || item.labels?.length" class="flex items-center flex-wrap gap-1 mt-0.5">
        <span
          v-if="item.categoryName"
          class="text-xs px-1.5 py-0.5 rounded-md font-medium"
          :style="item.categoryColor ? { background: item.categoryColor + '33', color: item.categoryColor } : {}"
          :class="!item.categoryColor ? 'bg-ctp-surface1 text-ctp-subtext0' : ''"
        >
          {{ item.categoryName }}
        </span>
        <span v-if="item.quantity" class="text-xs text-ctp-overlay1">
          {{ item.quantity }}{{ item.quantityUnit ? ' ' + item.quantityUnit : '' }}
        </span>
        <span v-if="item.price" class="text-xs text-ctp-overlay1">
          € {{ item.price.toFixed(2) }}
        </span>
        <LabelTag v-for="label in item.labels" :key="label.id" :label="label" />
      </div>
    </div>

    <!-- Thumbnail (after text so names always align) -->
    <img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      :alt="item.name"
      class="w-8 h-8 rounded-lg object-cover shrink-0"
    />

    <!-- Edit / Delete actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click.stop="emit('edit', item)"
        class="p-1.5 rounded-lg text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
        </svg>
      </button>
      <button
        @click.stop="emit('delete', item.id)"
        class="p-1.5 rounded-lg text-ctp-subtext0 hover:text-ctp-red hover:bg-ctp-red/10 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../../types'
import LabelTag from './LabelTag.vue'

const props = defineProps<{ item: Item }>()
const emit = defineEmits<{
  toggle: [itemId: string]
  edit: [item: Item]
  delete: [itemId: string]
}>()
</script>
