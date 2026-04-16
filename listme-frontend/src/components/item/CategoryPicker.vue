<script setup lang="ts">
import { ref } from 'vue'
import type { Category } from '../../types'

const props = defineProps<{
  categories: Category[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:selectedId': [id: string | null]
  'create': [name: string]
}>()

const showInput = ref(false)
const newName = ref('')

function select(id: string | null) {
  emit('update:selectedId', props.selectedId === id ? null : id)
}

function confirmCreate() {
  const name = newName.value.trim()
  if (!name) return
  emit('create', name)
  newName.value = ''
  showInput.value = false
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <!-- "Keine" chip -->
    <button
      type="button"
      @click="select(null)"
      class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
      :class="selectedId === null
        ? 'bg-ctp-surface2 text-ctp-text'
        : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'"
    >
      Keine
    </button>

    <!-- Existing categories -->
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      @click="select(cat.id)"
      class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
      :style="cat.color
        ? selectedId === cat.id
          ? { backgroundColor: cat.color, color: '#fff' }
          : { backgroundColor: cat.color + '33', color: cat.color }
        : {}"
      :class="!cat.color
        ? selectedId === cat.id
          ? 'bg-ctp-surface2 text-ctp-text'
          : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'
        : ''"
    >
      {{ cat.name }}
    </button>

    <!-- Inline create -->
    <template v-if="!showInput">
      <button
        type="button"
        @click="showInput = true"
        class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-ctp-surface0 text-ctp-overlay0 hover:bg-ctp-surface1 hover:text-ctp-subtext0 transition-all flex items-center gap-1"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Neu
      </button>
    </template>
    <template v-else>
      <div class="flex items-center gap-1">
        <input
          ref="newInput"
          v-model="newName"
          type="text"
          placeholder="Name…"
          maxlength="100"
          autofocus
          @keydown.enter="confirmCreate"
          @keydown.escape="showInput = false; newName = ''"
          class="w-24 px-2.5 py-1 rounded-full text-[11px] bg-ctp-surface0 border border-ctp-teal text-ctp-text placeholder-ctp-overlay0 outline-none"
        />
        <button
          type="button"
          @click="confirmCreate"
          :disabled="!newName.trim()"
          class="px-2 py-1 rounded-full text-[11px] font-semibold bg-ctp-teal text-ctp-base disabled:opacity-40 transition-all"
        >
          OK
        </button>
        <button
          type="button"
          @click="showInput = false; newName = ''"
          class="px-2 py-1 rounded-full text-[11px] bg-ctp-surface0 text-ctp-subtext0 transition-all"
        >
          ✕
        </button>
      </div>
    </template>
  </div>
</template>
