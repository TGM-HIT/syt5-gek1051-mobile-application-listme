import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePresenceStore } from './presence'

describe('usePresenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('getCount returns 0 for unknown list', () => {
    const store = usePresenceStore()
    expect(store.getCount('list-1')).toBe(0)
  })

  it('isOnline returns false for unknown list', () => {
    const store = usePresenceStore()
    expect(store.isOnline('list-1', 'dev-a')).toBe(false)
  })

  it('setSnapshot replaces the device set', () => {
    const store = usePresenceStore()
    store.setSnapshot('list-1', ['dev-a', 'dev-b'])
    expect(store.getCount('list-1')).toBe(2)
    expect(store.isOnline('list-1', 'dev-a')).toBe(true)
  })

  it('addDevice inserts into an existing set', () => {
    const store = usePresenceStore()
    store.setSnapshot('list-1', ['dev-a'])
    store.addDevice('list-1', 'dev-b')
    expect(store.getCount('list-1')).toBe(2)
    expect(store.isOnline('list-1', 'dev-b')).toBe(true)
  })

  it('addDevice creates set when list has no entry yet', () => {
    const store = usePresenceStore()
    store.addDevice('list-new', 'dev-x')
    expect(store.getCount('list-new')).toBe(1)
    expect(store.isOnline('list-new', 'dev-x')).toBe(true)
  })

  it('removeDevice decrements count', () => {
    const store = usePresenceStore()
    store.setSnapshot('list-1', ['dev-a', 'dev-b'])
    store.removeDevice('list-1', 'dev-a')
    expect(store.getCount('list-1')).toBe(1)
    expect(store.isOnline('list-1', 'dev-a')).toBe(false)
  })

  it('removeDevice on unknown list does not throw', () => {
    const store = usePresenceStore()
    expect(() => store.removeDevice('unknown', 'dev-x')).not.toThrow()
  })

  it('setSnapshot overwrites previous snapshot', () => {
    const store = usePresenceStore()
    store.setSnapshot('list-1', ['dev-a', 'dev-b'])
    store.setSnapshot('list-1', ['dev-c'])
    expect(store.getCount('list-1')).toBe(1)
    expect(store.isOnline('list-1', 'dev-a')).toBe(false)
    expect(store.isOnline('list-1', 'dev-c')).toBe(true)
  })

  it('separate lists are isolated', () => {
    const store = usePresenceStore()
    store.setSnapshot('list-1', ['dev-a'])
    store.setSnapshot('list-2', ['dev-b'])
    expect(store.isOnline('list-1', 'dev-b')).toBe(false)
    expect(store.isOnline('list-2', 'dev-a')).toBe(false)
  })
})
