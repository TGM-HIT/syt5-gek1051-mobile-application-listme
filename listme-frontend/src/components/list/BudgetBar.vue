<template>
  <div v-if="budget" class="bg-ctp-surface0/60 rounded-2xl p-3 mb-3">
    <!-- Header row: toggle + total -->
    <button
      type="button"
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between gap-2 text-left"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-ctp-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-semibold text-ctp-teal">€ {{ budget.total.toFixed(2) }}</span>
        <span class="text-xs text-ctp-overlay0">Budget (offen)</span>
      </div>
      <svg
        class="w-4 h-4 text-ctp-overlay0 transition-transform duration-200"
        :class="expanded ? 'rotate-180' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Breakdown rows -->
    <Transition name="budget-expand">
      <div v-if="expanded && Object.keys(budget.byCategory).length > 0" class="mt-2 space-y-1">
        <div
          v-for="(amount, cat) in budget.byCategory"
          :key="cat"
          class="flex justify-between items-center text-xs text-ctp-subtext0 px-1"
        >
          <span class="truncate">{{ cat }}</span>
          <span class="tabular-nums shrink-0 ml-2">€ {{ amount.toFixed(2) }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BudgetSummary } from '../../types'
import { budgetService } from '../../services/budget'

const props = defineProps<{
  listId: string
  itemsVersion: number
}>()

const budget = ref<BudgetSummary | null>(null)
const expanded = ref(false)

async function load() {
  try {
    budget.value = await budgetService.get(props.listId)
    if (budget.value.total === 0) budget.value = null
  } catch {
    budget.value = null
  }
}

watch(() => props.itemsVersion, load, { immediate: true })
</script>

<style scoped>
.budget-expand-enter-active,
.budget-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.budget-expand-enter-from,
.budget-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.budget-expand-enter-to,
.budget-expand-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
