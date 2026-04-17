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
    expect(w.findAll('[aria-label="Schließen"]')).toHaveLength(0)
  })

  it('renders a toast for each notification', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises() // let onMounted dismissAll run first
    store.add({ listId: 'l1', listName: 'Groceries', count: 1 })
    store.add({ listId: 'l2', listName: 'Shopping', count: 2 })
    await flushPromises()
    expect(w.findAll('[aria-label="Schließen"]')).toHaveLength(2)
  })

  it('shows list name in toast', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    store.add({ listId: 'l1', listName: 'Wocheneinkauf', count: 1 })
    await flushPromises()
    expect(w.text()).toContain('Wocheneinkauf')
  })

  it('clicking dismiss button removes the notification', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    await flushPromises()
    await w.find('[aria-label="Schließen"]').trigger('click')
    expect(store.notifications).toHaveLength(0)
  })

  it('dismissAll is called on mount, clearing pre-existing notifications', async () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    mount(ConflictToast, { global: { stubs } })
    await flushPromises()
    expect(store.notifications).toHaveLength(0)
  })

  it('auto-dismisses after 6 seconds', async () => {
    const store = useNotificationsStore()
    const w = mount(ConflictToast, { global: { stubs } })
    await flushPromises() // let onMounted run
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    await flushPromises() // let watch fire
    vi.advanceTimersByTime(6000)
    await flushPromises()
    expect(store.notifications).toHaveLength(0)
    w.unmount()
  })
})
