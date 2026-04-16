<script setup lang="ts">
import { ref, computed } from 'vue'
import { shareService } from '../../services/share'
import { pairWatch, getBluetoothSupportStatus } from '../../services/watchSync'

const emit = defineEmits<{ close: [] }>()

type Step = 'idle' | 'creating-token' | 'waiting-ble' | 'success' | 'error'

const step = ref<Step>('idle')
const errorMsg = ref('')
const watchDeviceId = ref('')

const btStatus = computed(() => getBluetoothSupportStatus())
const supported = computed(() => btStatus.value === 'supported')

const btWarning = computed(() => {
  switch (btStatus.value) {
    case 'not-secure':
      return 'Die App muss über HTTPS oder localhost geöffnet werden. HTTP über lokale IP (z. B. 192.168.x.x) blockiert Web Bluetooth — auch in Chrome.'
    case 'not-chrome':
      return 'Web Bluetooth wird nur in Chrome unterstützt. Bitte die App in Chrome öffnen.'
    default:
      return null
  }
})

async function startPairing() {
  step.value = 'creating-token'
  let syncToken: string

  try {
    // Reuse existing sync-token mechanism — creates a token grouping all device lists
    const res = await shareService.createSyncToken('watch')
    syncToken = res.token
  } catch {
    errorMsg.value = 'Sync-Token konnte nicht erstellt werden. Ist der Server erreichbar?'
    step.value = 'error'
    return
  }

  step.value = 'waiting-ble'

  try {
    const result = await pairWatch(syncToken)
    watchDeviceId.value = result.watchDeviceId
    step.value = 'success'
  } catch (e: any) {
    if (e?.name === 'NotFoundError' || e?.message?.includes('cancelled')) {
      // User cancelled the BT picker — go back to idle silently
      step.value = 'idle'
    } else {
      errorMsg.value = e?.message ?? 'Verbindung zur Uhr fehlgeschlagen.'
      step.value = 'error'
    }
  }
}

function reset() {
  step.value = 'idle'
  errorMsg.value = ''
  watchDeviceId.value = ''
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-ctp-mantle rounded-t-3xl px-6 pb-10 pt-5 animate-slide-up">

      <!-- Handle -->
      <div class="w-10 h-1 rounded-full bg-ctp-surface1 mx-auto mb-6" />

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-ctp-text">Uhr verknüpfen</h2>
        <button @click="emit('close')" class="text-ctp-subtext0 hover:text-ctp-text p-1">✕</button>
      </div>

      <!-- ── IDLE ── -->
      <div v-if="step === 'idle'" class="flex flex-col gap-5">
        <!-- Browser / context support warning -->
        <div v-if="btWarning" class="flex gap-3 bg-ctp-red/10 border border-ctp-red/30 rounded-xl px-4 py-3 text-sm text-ctp-red">
          <span class="mt-0.5 shrink-0">⚠️</span>
          <span>{{ btWarning }}</span>
        </div>

        <div class="flex flex-col gap-3 text-sm text-ctp-subtext1">
          <div class="flex items-start gap-3">
            <span class="text-xl mt-0.5">⌚</span>
            <div>
              <p class="font-medium text-ctp-text">ListMe Watch App öffnen</p>
              <p>App auf der Pixel Watch 3 starten, damit sie via Bluetooth erreichbar ist.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xl mt-0.5">📱</span>
            <div>
              <p class="font-medium text-ctp-text">Bluetooth aktiviert lassen</p>
              <p>Handy und Uhr müssen in Reichweite sein (ca. 10 m).</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xl mt-0.5">🔗</span>
            <div>
              <p class="font-medium text-ctp-text">Einmalige Verknüpfung</p>
              <p>Nach dem ersten Pairing sync die Uhr selbstständig via WLAN/LTE.</p>
            </div>
          </div>
        </div>

        <button
          @click="startPairing"
          :disabled="!supported"
          class="w-full py-3.5 bg-linear-to-r from-ctp-teal to-ctp-sapphire text-ctp-base font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Jetzt verbinden
        </button>
      </div>

      <!-- ── CREATING TOKEN ── -->
      <div v-else-if="step === 'creating-token'" class="flex flex-col items-center gap-4 py-6">
        <div class="w-10 h-10 border-4 border-ctp-sapphire border-t-transparent rounded-full animate-spin" />
        <p class="text-ctp-subtext1 text-sm">Sync-Token wird erstellt…</p>
      </div>

      <!-- ── WAITING FOR BLE PICKER ── -->
      <div v-else-if="step === 'waiting-ble'" class="flex flex-col items-center gap-4 py-6">
        <div class="text-5xl animate-pulse">📡</div>
        <div class="text-center">
          <p class="font-semibold text-ctp-text">Gerät auswählen</p>
          <p class="text-sm text-ctp-subtext1 mt-1 max-w-xs">
            Wähle im Bluetooth-Dialog deine Pixel Watch 3 aus.
            Stelle sicher, dass die Watch App im Vordergrund läuft.
          </p>
        </div>
      </div>

      <!-- ── SUCCESS ── -->
      <div v-else-if="step === 'success'" class="flex flex-col items-center gap-4 py-4">
        <div class="text-5xl">✅</div>
        <div class="text-center">
          <p class="font-semibold text-ctp-text text-lg">Uhr verknüpft!</p>
          <p class="text-sm text-ctp-subtext1 mt-1">
            Die Pixel Watch 3 lädt jetzt alle Listen herunter.<br>
            Ab sofort synct sie automatisch via WLAN/LTE.
          </p>
          <p v-if="watchDeviceId !== 'unbekannt'" class="text-xs text-ctp-overlay0 mt-2 font-mono">
            Watch ID: {{ watchDeviceId.slice(0, 8) }}…
          </p>
        </div>
        <button
          @click="emit('close')"
          class="mt-2 w-full py-3 bg-ctp-surface0 text-ctp-text font-medium rounded-2xl"
        >
          Fertig
        </button>
      </div>

      <!-- ── ERROR ── -->
      <div v-else-if="step === 'error'" class="flex flex-col items-center gap-4 py-4">
        <div class="text-5xl">❌</div>
        <div class="text-center">
          <p class="font-semibold text-ctp-text">Verbindung fehlgeschlagen</p>
          <p class="text-sm text-ctp-subtext1 mt-1 max-w-xs">{{ errorMsg }}</p>
        </div>
        <div class="flex gap-3 w-full">
          <button @click="reset" class="flex-1 py-3 bg-ctp-surface0 text-ctp-text font-medium rounded-2xl text-sm">
            Nochmal versuchen
          </button>
          <button @click="emit('close')" class="flex-1 py-3 border border-ctp-surface1 text-ctp-subtext0 font-medium rounded-2xl text-sm">
            Abbrechen
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
