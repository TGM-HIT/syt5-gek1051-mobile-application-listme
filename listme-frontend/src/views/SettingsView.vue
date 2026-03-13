<template>
  <div class="pt-16 pb-24 px-5 max-w-lg mx-auto">
    <!-- Header -->
    <div class="mt-4 mb-8 animate-fade-up">
      <p class="text-ctp-overlay1 text-sm">Personalisierung</p>
      <h2 class="text-2xl font-bold text-ctp-text mt-0.5">Einstellungen</h2>
    </div>

    <!-- Profile section -->
    <section class="mb-6 animate-fade-up">
      <p class="text-xs font-semibold text-ctp-overlay0 uppercase tracking-wider mb-3 px-1">Profil</p>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl p-4">
        <!-- Avatar + photo controls -->
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-full overflow-hidden bg-ctp-surface1 border-2 border-ctp-surface2 flex items-center justify-center shrink-0">
            <img v-if="profileStore.photoDataUrl" :src="profileStore.photoDataUrl" class="w-full h-full object-cover" alt="" />
            <span v-else class="text-xl font-bold text-ctp-subtext0">{{ profileStore.initials }}</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <button @click="photoInput?.click()" class="text-xs font-medium text-ctp-teal hover:text-ctp-sapphire transition-colors text-left">Bild ändern</button>
            <button v-if="profileStore.photoDataUrl" @click="profileStore.removePhoto()" class="text-xs text-ctp-overlay0 hover:text-ctp-red transition-colors text-left">Bild entfernen</button>
          </div>
          <input ref="photoInput" type="file" accept="image/*" class="hidden" @change="handlePhotoUpload" />
        </div>
        <!-- Name fields -->
        <div class="space-y-2.5">
          <input v-model="firstName" type="text" placeholder="Vorname" maxlength="50" class="w-full px-3 py-2.5 rounded-xl bg-ctp-surface1 border border-ctp-surface2 text-ctp-text placeholder-ctp-overlay0 text-sm outline-none focus:border-ctp-teal focus:ring-2 focus:ring-ctp-teal/20 transition-all" />
          <input v-model="lastName" type="text" placeholder="Nachname" maxlength="50" class="w-full px-3 py-2.5 rounded-xl bg-ctp-surface1 border border-ctp-surface2 text-ctp-text placeholder-ctp-overlay0 text-sm outline-none focus:border-ctp-teal focus:ring-2 focus:ring-ctp-teal/20 transition-all" @keydown.enter="saveProfile" />
          <button @click="saveProfile" :disabled="saving" class="w-full py-2.5 rounded-xl bg-ctp-teal text-ctp-base text-sm font-semibold disabled:opacity-40 transition-opacity">{{ saved ? 'Gespeichert ✓' : saving ? 'Speichern…' : 'Speichern' }}</button>
        </div>
      </div>
    </section>

    <!-- Appearance section -->
    <section class="mb-6 animate-fade-up" style="animation-delay: 60ms">
      <p class="text-xs font-semibold text-ctp-overlay0 uppercase tracking-wider mb-3 px-1">
        Erscheinungsbild
      </p>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-4">
          <div class="flex items-center gap-3">
            <!-- Icon -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                 :class="isDark ? 'bg-ctp-sapphire/15 text-ctp-sapphire' : 'bg-ctp-yellow/15 text-ctp-yellow'">
              <!-- Moon (dark mode active) -->
              <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <!-- Sun (light mode active) -->
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5" />
                <path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-ctp-text">Design</p>
              <p class="text-xs text-ctp-subtext0 mt-0.5">{{ isDark ? 'Dunkel (Frappe)' : 'Hell (Latte)' }}</p>
            </div>
          </div>

          <!-- Toggle -->
          <button
            @click="themeStore.toggle()"
            aria-label="Design wechseln"
            class="pressable relative w-12 h-6 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal"
            :class="isDark ? 'bg-ctp-teal' : 'bg-ctp-surface2'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ctp-base shadow transition-transform duration-300"
              :class="isDark ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </section>

    <!-- About section -->
    <section class="animate-fade-up" style="animation-delay: 120ms">
      <p class="text-xs font-semibold text-ctp-overlay0 uppercase tracking-wider mb-3 px-1">
        App
      </p>
      <div class="bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-2xl divide-y divide-ctp-surface1/40">
        <div class="flex items-center justify-between px-4 py-3.5">
          <span class="text-sm text-ctp-text">Version</span>
          <span class="text-sm text-ctp-subtext0 font-mono">Phase 9</span>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5">
          <span class="text-sm text-ctp-text">Theme</span>
          <span class="text-sm text-ctp-subtext0">Catppuccin {{ isDark ? 'Frappe' : 'Latte' }}</span>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5">
          <span class="text-sm text-ctp-text">Offline-first</span>
          <span class="text-sm text-ctp-green font-medium">Aktiv</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useProfileStore } from '../stores/profile'

const themeStore = useThemeStore()
const profileStore = useProfileStore()
const isDark = computed(() => themeStore.theme === 'dark')

const firstName = ref(profileStore.firstName)
const lastName = ref(profileStore.lastName)
const saving = ref(false)
const saved = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)

async function saveProfile() {
  saving.value = true
  saved.value = false
  await profileStore.save(firstName.value, lastName.value)
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

async function handlePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const dataUrl = await compressPhoto(file)
  await profileStore.savePhoto(dataUrl)
  if (photoInput.value) photoInput.value.value = ''
}

function compressPhoto(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const SIZE = 256
      const ratio = Math.min(SIZE / img.width, SIZE / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}
</script>
