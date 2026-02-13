<script setup lang="ts">
import { computed } from 'vue'
import type { ShoppingList } from '../../types'

const props = defineProps<{
  list: ShoppingList
  index: number
}>()

const progress = computed(() =>
  props.list.totalItems > 0
    ? Math.round((props.list.checkedItems / props.list.totalItems) * 100)
    : 0
)

const accentClasses = computed(() => {
  const map = {
    green: {
      border: 'border-l-ctp-green',
      progress: 'bg-ctp-green',
      glow: 'shadow-ctp-green/10',
      badge: 'bg-ctp-green/10 text-ctp-green',
    },
    teal: {
      border: 'border-l-ctp-teal',
      progress: 'bg-ctp-teal',
      glow: 'shadow-ctp-teal/10',
      badge: 'bg-ctp-teal/10 text-ctp-teal',
    },
    sapphire: {
      border: 'border-l-ctp-sapphire',
      progress: 'bg-ctp-sapphire',
      glow: 'shadow-ctp-sapphire/10',
      badge: 'bg-ctp-sapphire/10 text-ctp-sapphire',
    },
  }
  return map[props.list.accentColor]
})

const timeAgo = computed(() => props.list.updatedAt)
</script>

<template>
  <article
    class="
      pressable group
      bg-ctp-surface0/60 hover:bg-ctp-surface0
      border border-ctp-surface1/50 hover:border-ctp-surface1
      border-l-[3px] rounded-2xl
      p-4 cursor-pointer
      transition-all duration-200
      animate-fade-up
    "
    :class="[accentClasses.border, accentClasses.glow]"
    :style="{ animationDelay: `${index * 60}ms` }"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Left: emoji + info -->
      <div class="flex items-start gap-3 min-w-0 flex-1">
        <span class="text-2xl leading-none mt-0.5 shrink-0" role="img">{{ list.emoji }}</span>

        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-ctp-text truncate leading-tight">
            {{ list.name }}
          </h3>

          <div class="flex items-center gap-2 mt-1.5 text-xs text-ctp-overlay1">
            <span>{{ list.checkedItems }}/{{ list.totalItems }} items</span>
            <span class="w-0.5 h-0.5 rounded-full bg-ctp-overlay0" />
            <span>{{ timeAgo }}</span>
          </div>

          <!-- Participants (shared lists) -->
          <div v-if="list.shared && list.participants.length" class="flex items-center gap-1.5 mt-2.5">
            <div class="flex -space-x-1.5">
              <div
                v-for="p in list.participants.slice(0, 3)"
                :key="p.id"
                class="w-5 h-5 rounded-full border-2 border-ctp-surface0 flex items-center justify-center text-[8px] font-bold"
                :class="p.online ? 'bg-ctp-teal/20 text-ctp-teal' : 'bg-ctp-surface1 text-ctp-overlay0'"
                :title="p.name"
              >
                {{ p.initials }}
              </div>
              <div
                v-if="list.participants.length > 3"
                class="w-5 h-5 rounded-full border-2 border-ctp-surface0 bg-ctp-surface1 flex items-center justify-center text-[8px] font-medium text-ctp-overlay0"
              >
                +{{ list.participants.length - 3 }}
              </div>
            </div>
            <span class="text-[10px] text-ctp-overlay0">
              {{ list.participants.filter(p => p.online).length }} online
            </span>
          </div>
        </div>
      </div>

      <!-- Right: progress badge -->
      <div
        class="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold tabular-nums"
        :class="accentClasses.badge"
      >
        {{ progress }}%
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mt-3 h-1 bg-ctp-surface1 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :class="accentClasses.progress"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </article>
</template>
