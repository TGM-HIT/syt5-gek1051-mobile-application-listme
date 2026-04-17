<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../../stores/profile'
import QrScannerModal from './QrScannerModal.vue'

const router = useRouter()
const profileStore = useProfileStore()
const scrolled = ref(false)
const showScanner = ref(false)

onMounted(() => {
  const el = document.querySelector('.main-scroll')
  if (el) {
    el.addEventListener('scroll', () => {
      scrolled.value = el.scrollTop > 8
    })
  }
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
    :class="scrolled
      ? 'bg-ctp-mantle/80 backdrop-blur-xl border-b border-ctp-surface0/50 shadow-lg shadow-ctp-crust/20'
      : 'bg-transparent'"
    :style="{ paddingTop: 'env(safe-area-inset-top)' }"
  >
    <div class="flex items-center justify-between px-5 h-14">
      <div class="flex items-center gap-3">
        <img src="/icon.svg" class="w-8 h-8 rounded-xl shadow-lg shadow-ctp-teal/20" alt="ListMe" />
        <h1 class="text-lg font-semibold text-ctp-text tracking-tight">ListMe</h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- QR scan button -->
        <button
          @click="showScanner = true"
          class="pressable w-9 h-9 flex items-center justify-center rounded-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-subtext0 shrink-0"
          aria-label="QR-Code scannen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="3" height="3" rx="0.5"/>
            <path d="M17 14h4M14 17v4M17 21h4v-4"/>
          </svg>
        </button>

        <!-- Avatar (clickable → Settings) -->
        <button
          @click="router.push('/settings')"
          class="pressable w-9 h-9 rounded-full overflow-hidden bg-ctp-surface0 border border-ctp-surface1 flex items-center justify-center shrink-0"
          aria-label="Profil & Einstellungen"
        >
          <img v-if="profileStore.photoDataUrl" :src="profileStore.photoDataUrl" class="w-full h-full object-cover" alt="" />
          <span v-else class="text-xs font-semibold text-ctp-subtext0">{{ profileStore.initials }}</span>
        </button>
      </div>
    </div>
  </header>

  <QrScannerModal v-if="showScanner" @close="showScanner = false" />
</template>
