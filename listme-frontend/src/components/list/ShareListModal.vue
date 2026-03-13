<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import QRCode from 'qrcode'
import { shareService } from '../../services/share'
import type { ShoppingList } from '../../types'

const props = defineProps<{
  modelValue: boolean
  list: ShoppingList
}>()
const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'token-changed': [token: string | null]
}>()

const close = () => emit('update:modelValue', false)

const loading = ref(false)
const copied = ref(false)
const revoking = ref(false)
const showQR = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const token = ref<string | null>(props.list.shareToken)

watch(() => props.list.shareToken, t => { token.value = t })

const shareUrl = computed(() =>
  token.value ? `${window.location.origin}/s/${token.value}` : null
)

watch(() => props.modelValue, async (open) => {
  if (!open) return
  copied.value = false
  showQR.value = false
  if (!token.value) {
    loading.value = true
    try {
      const res = await shareService.generateToken(props.list.id)
      token.value = res.token
      emit('token-changed', res.token)
    } finally {
      loading.value = false
    }
  }
})

watch(showQR, async (show) => {
  if (show && shareUrl.value) {
    await nextTick()
    if (qrCanvas.value) {
      await QRCode.toCanvas(qrCanvas.value, shareUrl.value, {
        width: 200,
        margin: 2,
        color: { dark: '#303446', light: '#eff1f5' },
      })
    }
  }
})

async function copyLink() {
  if (!shareUrl.value) return
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function revoke() {
  revoking.value = true
  try {
    await shareService.revokeToken(props.list.id)
    token.value = null
    emit('token-changed', null)
    close()
  } finally {
    revoking.value = false
  }
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

        <h2 class="text-lg font-bold text-ctp-text mb-1">Liste teilen</h2>
        <p class="text-sm text-ctp-subtext0 mb-5">
          Jeder mit dem Link kann diese Liste beitreten.
        </p>

        <!-- Loading -->
        <div v-if="loading" class="h-12 bg-ctp-surface0 rounded-xl skeleton mb-4" />

        <!-- Share URL -->
        <div v-else-if="shareUrl" class="space-y-3">
          <div class="flex items-center gap-2 bg-ctp-surface0 rounded-xl px-4 py-3">
            <span class="flex-1 text-sm text-ctp-text truncate font-mono">{{ shareUrl }}</span>
          </div>

          <!-- QR toggle -->
          <button
            @click="showQR = !showQR"
            class="w-full py-2.5 rounded-xl text-sm font-medium bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><path stroke-linecap="round" d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v2h-3zM19 18h2v3h-2z"/>
            </svg>
            {{ showQR ? 'QR-Code ausblenden' : 'Als QR-Code anzeigen' }}
          </button>

          <!-- QR Code -->
          <Transition name="qr">
            <div v-if="showQR" class="flex justify-center py-5 bg-ctp-surface0 rounded-2xl">
              <canvas ref="qrCanvas" class="rounded-xl" />
            </div>
          </Transition>

          <button
            @click="copyLink"
            class="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
            :class="copied
              ? 'bg-ctp-green/20 text-ctp-green'
              : 'bg-ctp-teal text-ctp-base active:scale-95'"
          >
            {{ copied ? '✓ Kopiert!' : 'Link kopieren' }}
          </button>

          <button
            @click="revoke"
            :disabled="revoking"
            class="w-full py-2.5 rounded-xl text-sm font-medium bg-ctp-red/10 text-ctp-red disabled:opacity-60"
          >
            {{ revoking ? 'Widerrufe…' : 'Link widerrufen' }}
          </button>
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
.sheet-enter-from .relative,
.sheet-leave-to .relative {
  transform: translateY(100%);
}
.qr-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.qr-leave-active { transition: all 0.2s ease; }
.qr-enter-from { opacity: 0; transform: scaleY(0.85); transform-origin: top; }
.qr-leave-to { opacity: 0; }
</style>
