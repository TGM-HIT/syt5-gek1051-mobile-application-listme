import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// isOnline ref we can mutate per test
const isOnline = ref(true)

vi.mock('../../composables/useOffline', () => ({
  useOffline: () => ({ isOnline }),
}))

import ConnectionBanner from './ConnectionBanner.vue'

describe('ConnectionBanner', () => {
  beforeEach(() => {
    isOnline.value = true
    vi.clearAllMocks()
  })

  it('shows offline message when isOnline is false', async () => {
    isOnline.value = false
    const wrapper = mount(ConnectionBanner, {
      props: { connected: false },
      global: { stubs: { Teleport: true, Transition: false } },
    })
    await nextTick()
    expect(wrapper.text()).toContain('Kein Internet')
  })

  it('shows syncing message when online but not connected to WS', async () => {
    isOnline.value = true
    const wrapper = mount(ConnectionBanner, {
      props: { connected: false },
      global: { stubs: { Teleport: true, Transition: false } },
    })
    await nextTick()
    expect(wrapper.text()).toContain('Verbindung wird hergestellt')
  })

  it('shows nothing on initial connected state', async () => {
    isOnline.value = true
    const wrapper = mount(ConnectionBanner, {
      props: { connected: true },
      global: { stubs: { Teleport: true, Transition: false } },
    })
    await nextTick()
    // show starts false and onMounted doesn't set it when already connected
    expect(wrapper.text()).not.toContain('Kein Internet')
    expect(wrapper.text()).not.toContain('Verbindung wird hergestellt')
  })
})
