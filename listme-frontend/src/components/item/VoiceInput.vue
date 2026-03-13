<template>
  <button
    type="button"
    @click="toggle"
    :disabled="unsupported"
    :class="[
      'relative flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal',
      size === 'sm' ? 'w-9 h-9' : 'w-10 h-10',
      isListening
        ? 'bg-ctp-red text-white shadow-lg shadow-ctp-red/30 scale-105'
        : unsupported
          ? 'bg-ctp-surface0 text-ctp-overlay0 cursor-not-allowed'
          : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text',
    ]"
    :title="unsupported ? 'Spracheingabe nicht verfügbar' : isListening ? 'Aufnahme stoppen' : 'Sprachein­gabe'"
    :aria-label="isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'"
    :aria-pressed="isListening"
  >
    <!-- Pulse ring when recording -->
    <span v-if="isListening" class="absolute inset-0 rounded-xl bg-ctp-red animate-ping opacity-40" />

    <!-- Mic icon -->
    <svg class="w-4 h-4 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md'
}>(), { size: 'sm' })

const emit = defineEmits<{
  'result': [text: string]
  'error': [msg: string]
}>()

const isListening = ref(false)
const unsupported = ref(!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))

// @ts-ignore
const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
let recognition: any = null

function toggle() {
  if (unsupported.value) return
  isListening.value ? stop() : start()
}

function start() {
  recognition = new SR()
  recognition.lang = 'de-DE'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (e: any) => {
    const transcript: string = e.results[0][0].transcript
    emit('result', transcript)
  }
  recognition.onerror = () => {
    emit('error', 'Spracheingabe fehlgeschlagen')
    isListening.value = false
  }
  recognition.onend = () => {
    isListening.value = false
  }

  recognition.start()
  isListening.value = true
}

function stop() {
  recognition?.stop()
  isListening.value = false
}

onUnmounted(stop)
</script>
