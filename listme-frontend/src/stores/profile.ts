import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useProfileStore = defineStore('profile', () => {
  const firstName = ref(localStorage.getItem('profile:firstName') ?? '')
  const lastName = ref(localStorage.getItem('profile:lastName') ?? '')
  const photoDataUrl = ref(localStorage.getItem('profile:photo') ?? '')

  const displayName = computed(() => {
    const parts = [firstName.value.trim(), lastName.value.trim()].filter(Boolean)
    return parts.join(' ')
  })

  const initials = computed(() => {
    const f = firstName.value.trim()
    const l = lastName.value.trim()
    if (f && l) return (f.charAt(0) + l.charAt(0)).toUpperCase()
    if (f) return f.slice(0, 2).toUpperCase()
    return '?'
  })

  function buildPatch(nameOverride?: string | null, photoOverride?: string | null) {
    const name = nameOverride !== undefined ? nameOverride : (displayName.value || null)
    const photo = photoOverride !== undefined ? photoOverride : (photoDataUrl.value || null)
    return { displayName: name, profilePicture: photo }
  }

  async function save(first: string, last: string) {
    firstName.value = first
    lastName.value = last
    localStorage.setItem('profile:firstName', first)
    localStorage.setItem('profile:lastName', last)
    const name = [first.trim(), last.trim()].filter(Boolean).join(' ')
    try { await api.patch('/users/me', buildPatch(name || null)) } catch { /* offline */ }
  }

  async function savePhoto(dataUrl: string) {
    photoDataUrl.value = dataUrl
    try { localStorage.setItem('profile:photo', dataUrl) } catch { /* quota exceeded */ }
    try { await api.patch('/users/me', buildPatch(undefined, dataUrl)) } catch { /* offline */ }
  }

  async function removePhoto() {
    photoDataUrl.value = ''
    localStorage.removeItem('profile:photo')
    try { await api.patch('/users/me', buildPatch(undefined, null)) } catch { /* offline */ }
  }

  async function init() {
    const name = displayName.value || null
    const photo = photoDataUrl.value || null
    if (name || photo) {
      try { await api.patch('/users/me', { displayName: name, profilePicture: photo }) } catch { /* ignore */ }
    }
  }

  function applyFromSync(rawDisplayName: string | null, rawPhoto: string | null) {
    const parts = rawDisplayName?.split(' ') ?? []
    const first = parts[0] ?? ''
    const last = parts.slice(1).join(' ')
    firstName.value = first
    lastName.value = last
    localStorage.setItem('profile:firstName', first)
    localStorage.setItem('profile:lastName', last)
    if (rawPhoto) {
      photoDataUrl.value = rawPhoto
      try { localStorage.setItem('profile:photo', rawPhoto) } catch { /* quota */ }
    }
  }

  return { firstName, lastName, displayName, initials, photoDataUrl, save, savePhoto, removePhoto, init, applyFromSync }
})
