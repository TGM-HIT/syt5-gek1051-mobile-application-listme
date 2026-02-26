import { ref } from 'vue'

/**
 * Singleton reactive online state — module-level so all consumers share
 * the same ref and only one pair of event listeners is ever registered.
 */
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
}

export function useOffline() {
  return { isOnline }
}
