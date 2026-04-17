import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '../../stores/notifications'

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return { ...actual, Teleport: actual.defineComponent({ render: () => null }) }
})

import ConflictToast from './ConflictToast.vue'

describe('ConflictToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('test-id'),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when store is empty', () => {
    const w = mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    expect(w.findAll('[aria-label="Schließen"]')).toHaveLength(0)
  })

  it('renders a toast for each notification', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'Groceries', count: 1 })
    store.add({ listId: 'l2', listName: 'Shopping', count: 2 })
    const w = mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    expect(w.findAll('[aria-label="Schließen"]')).toHaveLength(2)
  })

  it('shows list name in toast', () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'Wocheneinkauf', count: 1 })
    const w = mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    expect(w.text()).toContain('Wocheneinkauf')
  })

  it('clicking dismiss button removes the notification', async () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    const w = mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    await w.find('[aria-label="Schließen"]').trigger('click')
    expect(store.notifications).toHaveLength(0)
  })

  it('dismissAll is called on mount', async () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    await flushPromises()
    expect(store.notifications).toHaveLength(0)
  })

  it('auto-dismisses after 6 seconds', async () => {
    const store = useNotificationsStore()
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    // Mount after adding so dismissAll on mount doesn't interfere
    const w = mount(ConflictToast, { global: { stubs: { Teleport: true, TransitionGroup: true } } })
    // Re-add after mount's dismissAll
    store.add({ listId: 'l1', listName: 'A', count: 1 })
    await flushPromises()
    vi.advanceTimersByTime(6000)
    await flushPromises()
    expect(store.notifications).toHaveLength(0)
    w.unmount()
  })
})
