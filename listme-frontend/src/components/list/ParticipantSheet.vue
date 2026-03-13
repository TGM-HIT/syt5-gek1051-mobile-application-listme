<script setup lang="ts">
import { computed } from 'vue'
import type { ParticipantResponse, Item } from '../../types'

const props = defineProps<{
  participant: ParticipantResponse | null
  items: Item[]
}>()

defineEmits<{ close: [] }>()

const name = computed(() => props.participant?.displayName || null)

const initials = computed(() => {
  if (!props.participant) return ''
  if (name.value) {
    const parts = name.value.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
    return name.value.slice(0, 2).toUpperCase()
  }
  return props.participant.deviceId.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  if (!props.participant) return ''
  return props.participant.role === 'owner' ? 'Ersteller' : 'Teilnehmer'
})

const theirItems = computed(() => {
  if (!props.participant) return []
  return props.items.filter(i => i.createdByDeviceId === props.participant!.deviceId && !i.deletedAt)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="participant" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-ctp-crust/60 backdrop-blur-sm" @click="$emit('close')" />
        <div class="relative bg-ctp-mantle rounded-t-3xl px-5 pt-4 pb-10 max-w-lg mx-auto w-full safe-bottom">
          <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-5" />

          <!-- Identity -->
          <div class="flex items-center gap-3 mb-5">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-ctp-teal flex items-center justify-center text-ctp-base font-bold text-lg shrink-0">
              <img v-if="participant.profilePicture" :src="participant.profilePicture" class="w-full h-full object-cover" alt="" />
              <span v-else>{{ initials }}</span>
            </div>
            <div>
              <p class="font-semibold text-ctp-text">{{ name || 'Unbekanntes Gerät' }}</p>
              <p class="text-xs text-ctp-overlay0">{{ roleLabel }} · Gerät {{ participant.deviceId.slice(0, 8) }}</p>
            </div>
          </div>

          <!-- Items added -->
          <p class="text-xs font-semibold text-ctp-overlay0 uppercase tracking-wider mb-2">
            Hinzugefügte Artikel
            <span class="font-normal">({{ theirItems.length }})</span>
          </p>

          <div v-if="theirItems.length === 0" class="text-sm text-ctp-overlay0 text-center py-4">
            Noch keine Artikel hinzugefügt
          </div>

          <div v-else class="space-y-1.5 max-h-56 overflow-y-auto">
            <div
              v-for="item in theirItems"
              :key="item.id"
              class="flex items-center gap-3 px-3 py-2 bg-ctp-surface0 rounded-xl"
            >
              <div
                class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="item.checked ? 'bg-ctp-teal border-ctp-teal' : 'border-ctp-overlay0'"
              >
                <svg v-if="item.checked" class="w-2.5 h-2.5 text-ctp-base" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm text-ctp-text flex-1 truncate" :class="item.checked ? 'line-through text-ctp-overlay0' : ''">
                {{ item.name }}
              </span>
              <span v-if="item.quantityUnit || item.quantity" class="text-xs text-ctp-overlay0 shrink-0">
                {{ item.quantity }}{{ item.quantityUnit ? ' ' + item.quantityUnit : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease; }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); opacity: 0; }
</style>
