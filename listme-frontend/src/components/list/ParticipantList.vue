<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { shareService } from '../../services/share'
import type { ParticipantResponse } from '../../types'

const props = defineProps<{ listId: string }>()
const emit = defineEmits<{ 'click-participant': [p: ParticipantResponse] }>()

const participants = ref<ParticipantResponse[]>([])

onMounted(async () => {
  try {
    participants.value = await shareService.getParticipants(props.listId)
  } catch {
    // non-critical
  }
})

const MAX_VISIBLE = 5
const visible = computed(() => participants.value.slice(0, MAX_VISIBLE))
const overflow = computed(() => Math.max(0, participants.value.length - MAX_VISIBLE))

function avatarLetters(p: ParticipantResponse): string {
  if (p.displayName) {
    const parts = p.displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
    return p.displayName.slice(0, 2).toUpperCase()
  }
  return p.deviceId.charAt(0).toUpperCase()
}

const colors = ['bg-ctp-teal', 'bg-ctp-sapphire', 'bg-ctp-green', 'bg-ctp-mauve', 'bg-ctp-peach']
function avatarColor(index: number) {
  return colors[index % colors.length]
}
</script>

<template>
  <div v-if="participants.length > 1" class="flex items-center gap-1 px-4 pb-2">
    <button
      v-for="(p, i) in visible"
      :key="p.deviceId"
      class="w-6 h-6 rounded-full overflow-hidden shrink-0 -ml-1 first:ml-0 ring-1 ring-ctp-mantle transition-transform active:scale-90 flex items-center justify-center text-[10px] font-bold text-ctp-base"
      :class="p.profilePicture ? '' : avatarColor(i)"
      :title="p.displayName || p.role"
      @click="emit('click-participant', p)"
    >
      <img v-if="p.profilePicture" :src="p.profilePicture" class="w-full h-full object-cover" alt="" />
      <span v-else>{{ avatarLetters(p) }}</span>
    </button>
    <div
      v-if="overflow > 0"
      class="w-6 h-6 rounded-full bg-ctp-surface1 flex items-center justify-center text-[9px] font-bold text-ctp-subtext0 -ml-1 ring-1 ring-ctp-mantle"
    >
      +{{ overflow }}
    </div>
    <span class="text-xs text-ctp-overlay0 ml-2">{{ participants.length }} Teilnehmer</span>
  </div>
</template>
