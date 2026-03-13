<template>
  <div class="flex items-center gap-3">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="onFileChange"
    />

    <!-- Trigger button / thumbnail -->
    <button
      v-if="!modelValue"
      type="button"
      @click="fileInput?.click()"
      :disabled="uploading"
      class="flex items-center gap-2 text-sm text-ctp-subtext0 bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-surface1 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
    >
      <svg v-if="!uploading" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4-4m0 0l4 4m-4-4v9M20 12a8 8 0 00-8-8 8 8 0 00-8 8" />
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="0" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
      <svg v-else class="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span>{{ uploading ? 'Hochladen…' : 'Bild hinzufügen' }}</span>
    </button>

    <!-- Thumbnail + remove -->
    <div v-else class="relative inline-flex shrink-0">
      <img
        :src="modelValue"
        alt="Item Bild"
        class="w-12 h-12 rounded-xl object-cover border border-ctp-surface1"
      />
      <button
        type="button"
        @click="emit('update:modelValue', null)"
        class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ctp-red text-ctp-base flex items-center justify-center"
        title="Bild entfernen"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <span v-if="error" class="text-xs text-ctp-red">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { imageService } from '../../services/image'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = null
  uploading.value = true
  try {
    const url = await imageService.upload(file)
    emit('update:modelValue', url)
  } catch {
    error.value = 'Upload fehlgeschlagen'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>
