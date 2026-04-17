<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import jsQR from 'jsqr'

const emit = defineEmits<{ close: [] }>()
const router = useRouter()

const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const error = ref<string | null>(null)
const detected = ref(false)

let stream: MediaStream | null = null
let rafId: number | null = null

async function start() {
  error.value = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
  } catch {
    try {
      // Fallback: any camera (e.g. desktop front cam)
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    } catch {
      error.value = 'Kamera nicht verfügbar oder Zugriff verweigert.'
      return
    }
  }

  if (!videoEl.value) return
  videoEl.value.srcObject = stream
  await videoEl.value.play()
  scanLoop()
}

function scanLoop() {
  if (!videoEl.value || !canvasEl.value || detected.value) return

  const video = videoEl.value
  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code?.data) {
      handleDetected(code.data)
      return
    }
  }

  rafId = requestAnimationFrame(scanLoop)
}

function handleDetected(raw: string) {
  detected.value = true
  stop()

  // Match share URLs: anything ending in /s/<token>
  const match = raw.match(/\/s\/([A-Za-z0-9_-]+)\s*$/)
  if (match) {
    router.push(`/s/${match[1]}`)
    emit('close')
    return
  }

  // Not a recognisable ListMe invite link
  error.value = 'Kein gültiger ListMe-Einladungslink erkannt.'
  detected.value = false
  // Resume scanning after short pause
  setTimeout(() => {
    if (stream) scanLoop()
  }, 1500)
}

function stop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

function close() {
  stop()
  emit('close')
}

// Auto-start when component mounts
start()

onUnmounted(stop)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex flex-col bg-ctp-crust"
      :style="{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 h-14 shrink-0">
        <h2 class="text-base font-semibold text-ctp-text">QR-Code scannen</h2>
        <button
          @click="close"
          class="pressable w-9 h-9 flex items-center justify-center rounded-full bg-ctp-surface0 text-ctp-subtext0"
          aria-label="Schließen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Camera viewport -->
      <div class="relative flex-1 overflow-hidden">
        <video ref="videoEl" class="absolute inset-0 w-full h-full object-cover" muted playsinline />
        <!-- Hidden canvas used for frame analysis -->
        <canvas ref="canvasEl" class="hidden" />

        <!-- Scanning frame overlay -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <!-- Dark vignette mask -->
          <div class="absolute inset-0 bg-ctp-crust/50" style="mask-image: radial-gradient(ellipse 55% 42% at 50% 50%, transparent 95%, black 100%); -webkit-mask-image: radial-gradient(ellipse 55% 42% at 50% 50%, transparent 95%, black 100%)" />

          <!-- Corner brackets -->
          <div class="relative w-56 h-56">
            <span class="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-ctp-teal rounded-tl-lg" />
            <span class="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-ctp-teal rounded-tr-lg" />
            <span class="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-ctp-teal rounded-bl-lg" />
            <span class="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-ctp-teal rounded-br-lg" />

            <!-- Scanning line -->
            <div v-if="!error" class="absolute inset-x-2 h-0.5 bg-ctp-teal/80 rounded-full animate-scan-line" />
          </div>
        </div>
      </div>

      <!-- Footer hint / error -->
      <div class="px-5 py-4 shrink-0 text-center">
        <p v-if="error" class="text-ctp-red text-sm">{{ error }}</p>
        <p v-else class="text-ctp-overlay0 text-sm">Richte die Kamera auf einen ListMe-QR-Code</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.border-t-3 { border-top-width: 3px; }
.border-b-3 { border-bottom-width: 3px; }
.border-l-3 { border-left-width: 3px; }
.border-r-3 { border-right-width: 3px; }

@keyframes scan-line {
  0%   { top: 8px; opacity: 1; }
  50%  { top: calc(100% - 8px); opacity: 1; }
  100% { top: 8px; opacity: 1; }
}
.animate-scan-line {
  animation: scan-line 2s ease-in-out infinite;
}
</style>
