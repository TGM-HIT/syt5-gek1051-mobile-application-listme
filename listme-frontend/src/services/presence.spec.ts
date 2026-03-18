import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePresenceStore } from './presence'

describe('usePresenceStore (services/presence)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('getCount returns 0 for unknown list', () => {
    const store = usePresenceStore()
    expect(store.getCount('unknown')).toBe(0)
  })

  it('setSnapshot sets device IDs for a list', () => {
    const store = usePresenceStore()
    store.setSnapshot('l1', ['dev1', 'dev2'])
    expect(store.getCount('l1')).toBe(2)
  })

  it('addDevice increases count', () => {
    const store = usePresenceStore()
    store.setSnapshot('l1', ['dev1'])
    store.addDevice('l1', 'dev2')
    expect(store.getCount('l1')).toBe(2)
  })

  it('removeDevice decreases count', () => {
    const store = usePresenceStore()
    store.setSnapshot('l1', ['dev1', 'dev2'])
    store.removeDevice('l1', 'dev1')
    expect(store.getCount('l1')).toBe(1)
  })

  it('isOnline returns true for device in set', () => {
    const store = usePresenceStore()
    store.setSnapshot('l1', ['dev1'])
    expect(store.isOnline('l1', 'dev1')).toBe(true)
  })

  it('isOnline returns false for unknown device', () => {
    const store = usePresenceStore()
    store.setSnapshot('l1', ['dev1'])
    expect(store.isOnline('l1', 'unknown')).toBe(false)
  })

  it('addDevice creates set if list unknown', () => {
    const store = usePresenceStore()
    store.addDevice('new-list', 'dev1')
    expect(store.getCount('new-list')).toBe(1)
  })
})
