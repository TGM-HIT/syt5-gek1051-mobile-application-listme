import { describe, it, expect, beforeEach } from 'vitest'
import { useOffline } from './useOffline'

describe('useOffline', () => {
  beforeEach(() => {
    // Reset to online state before each test
    window.dispatchEvent(new Event('online'))
  })

  it('returns isOnline ref', () => {
    const { isOnline } = useOffline()
    expect(isOnline).toBeDefined()
    expect(typeof isOnline.value).toBe('boolean')
  })

  it('isOnline is true when navigator.onLine is true', () => {
    window.dispatchEvent(new Event('online'))
    const { isOnline } = useOffline()
    expect(isOnline.value).toBe(true)
  })

  it('isOnline becomes false when offline event fires', () => {
    window.dispatchEvent(new Event('offline'))
    const { isOnline } = useOffline()
    expect(isOnline.value).toBe(false)
  })

  it('isOnline becomes true when online event fires after going offline', () => {
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    const { isOnline } = useOffline()
    expect(isOnline.value).toBe(true)
  })

  it('multiple calls to useOffline share the same ref', () => {
    window.dispatchEvent(new Event('offline'))
    const { isOnline: a } = useOffline()
    const { isOnline: b } = useOffline()
    expect(a).toBe(b)
    expect(a.value).toBe(false)
  })
})
