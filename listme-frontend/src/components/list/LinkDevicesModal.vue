<script setup lang="ts">
import { ref, watch } from 'vue'
import { shareService } from '../../services/share'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [val: boolean] }>()

const close = () => emit('update:modelValue', false)

const loading = ref(false)
const copied = ref(false)
const syncUrl = ref<string | null>(null)
const expiresAt = ref<string | null>(null)

watch(() => props.modelValue, async (open) => {
  if (!open) return
  copied.value = false
  syncUrl.value = null
  loading.value = true
  try {
    const res = await shareService.createSyncToken()
    syncUrl.value = `${window.location.origin}/sync/${res.token}`
    expiresAt.value = new Date(res.expiresAt).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } finally {
    loading.value = false
  }
})

async function copyLink() {
  if (!syncUrl.value) return
  await navigator.clipboard.writeText(syncUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-ctp-base/70 backdrop-blur-sm" @click="close" />

      <!-- Panel -->
      <div class="relative bg-ctp-mantle border-t border-ctp-surface0 rounded-t-3xl px-5 pt-4 pb-10 safe-bottom">
        <!-- Handle -->
        <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-5" />

        <h2 class="text-lg font-bold text-ctp-text mb-1">Geräte verknüpfen</h2>
        <p class="text-sm text-ctp-subtext0 mb-5">
          Öffne diesen Link auf einem anderen Gerät, um alle deine Listen zu übertragen.
        </p>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
          <div class="h-12 bg-ctp-surface0 rounded-xl skeleton" />
          <div class="h-12 bg-ctp-surface0 rounded-xl skeleton" />
        </div>

        <!-- Sync URL -->
        <div v-else-if="syncUrl" class="space-y-3">
          <div class="flex items-center gap-2 bg-ctp-surface0 rounded-xl px-4 py-3">
            <span class="flex-1 text-sm text-ctp-text truncate font-mono">{{ syncUrl }}</span>
          </div>

          <button
            @click="copyLink"
            class="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
            :class="copied
              ? 'bg-ctp-green/20 text-ctp-green'
              : 'bg-ctp-teal text-ctp-base active:scale-95'"
          >
            {{ copied ? '✓ Kopiert!' : 'Link kopieren' }}
          </button>

          <p v-if="expiresAt" class="text-xs text-ctp-overlay0 text-center">
            Link gültig bis {{ expiresAt }}
          </p>
        </div>

        <button
          @click="close"
          class="w-full mt-3 py-2.5 text-ctp-subtext0 text-sm rounded-xl hover:text-ctp-text transition-colors"
        >
          Schließen
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
