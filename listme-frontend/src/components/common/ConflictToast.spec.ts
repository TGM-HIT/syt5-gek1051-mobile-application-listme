import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '../../stores/notifications'
import ConflictToast from './ConflictToast.vue'

const stubs = {
  Teleport: { template: '<div><slot /></div>' },
  TransitionGroup: { template: '<div><slot /></div>' },
}

describe('ConflictToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('test-id') })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders nothing when store is empty', async () => {
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    expect(w.findAll('[aria-label="Bestätigen"]')).toHaveLength(0)
  })

  it('renders a toast for each notification', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises() // let onMounted dismissAll run first
    store.add({ listId: 'l1', listName: 'Groceries', message: 'Artikel hinzugefügt' })
    store.add({ listId: 'l2', listName: 'Shopping', message: 'Artikel gelöscht' })
    await flushPromises()
    expect(w.findAll('[aria-label="Bestätigen"]')).toHaveLength(2)
  })

  it('shows list name in toast', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    store.add({ listId: 'l1', listName: 'Wocheneinkauf', message: 'Artikel hinzugefügt' })
    await flushPromises()
    expect(w.text()).toContain('Wocheneinkauf')
  })

  it('clicking dismiss button removes the notification', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    store.add({ listId: 'l1', listName: 'A', message: 'Artikel hinzugefügt' })
    await flushPromises()
    await w.find('[aria-label="Bestätigen"]').trigger('click')
    expect(store.notifications).toHaveLength(0)
  })

  it('dismissAll is called on mount, clearing pre-existing notifications', async () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', message: 'Artikel hinzugefügt' })
    mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    expect(store.notifications).toHaveLength(0)
  })

  it('does not auto-dismiss — stays until check button clicked', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    store.add({ listId: 'l1', listName: 'A', message: 'Artikel hinzugefügt' })
    await flushPromises()
    vi.advanceTimersByTime(10000)
    await flushPromises()
    expect(store.notifications).toHaveLength(1)
    w.unmount()
  })
})
