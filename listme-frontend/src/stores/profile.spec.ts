import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockPatch } = vi.hoisted(() => ({
  mockPatch: vi.fn().mockResolvedValue({}),
}))

vi.mock('../services/api', () => ({
  default: { patch: mockPatch },
}))

import { useProfileStore } from './profile'

describe('useProfileStore', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPatch.mockClear()
    setActivePinia(createPinia())
  })

  it('displayName is empty string when nothing stored', () => {
    const store = useProfileStore()
    expect(store.displayName).toBe('')
  })

  it('initials returns ? when no name', () => {
    const store = useProfileStore()
    expect(store.initials).toBe('?')
  })

  it('displayName joins first and last name', async () => {
    const store = useProfileStore()
    await store.save('Alice', 'Smith')
    expect(store.displayName).toBe('Alice Smith')
  })

  it('initials returns first chars of first and last name', async () => {
    const store = useProfileStore()
    await store.save('Alice', 'Smith')
    expect(store.initials).toBe('AS')
  })

  it('initials returns two chars from first name when no last name', async () => {
    const store = useProfileStore()
    await store.save('Alice', '')
    expect(store.initials).toBe('AL')
  })

  it('save persists name to localStorage', async () => {
    const store = useProfileStore()
    await store.save('Bob', 'Jones')
    expect(localStorage.getItem('profile:firstName')).toBe('Bob')
    expect(localStorage.getItem('profile:lastName')).toBe('Jones')
  })

  it('save calls api.patch', async () => {
    const store = useProfileStore()
    await store.save('Bob', 'Jones')
    expect(mockPatch).toHaveBeenCalledWith('/users/me', expect.objectContaining({ displayName: 'Bob Jones' }))
  })

  it('save does not throw when api fails (offline)', async () => {
    mockPatch.mockRejectedValueOnce(new Error('network'))
    const store = useProfileStore()
    await expect(store.save('Bob', 'Jones')).resolves.not.toThrow()
  })

  it('savePhoto stores dataUrl and patches api', async () => {
    const store = useProfileStore()
    await store.savePhoto('data:image/png;base64,abc')
    expect(store.photoDataUrl).toBe('data:image/png;base64,abc')
    expect(mockPatch).toHaveBeenCalledWith('/users/me', expect.objectContaining({ profilePicture: 'data:image/png;base64,abc' }))
  })

  it('removePhoto clears photoDataUrl', async () => {
    const store = useProfileStore()
    await store.savePhoto('data:image/png;base64,abc')
    await store.removePhoto()
    expect(store.photoDataUrl).toBe('')
    expect(mockPatch).toHaveBeenLastCalledWith('/users/me', expect.objectContaining({ profilePicture: null }))
  })

  it('init does not call api when name and photo are empty', async () => {
    const store = useProfileStore()
    await store.init()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('init calls api when name is present', async () => {
    localStorage.setItem('profile:firstName', 'Carol')
    setActivePinia(createPinia())
    const store = useProfileStore()
    await store.init()
    expect(mockPatch).toHaveBeenCalled()
  })
})
