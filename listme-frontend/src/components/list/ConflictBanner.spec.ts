import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConflictBanner from './ConflictBanner.vue'
import type { Conflict } from '../../crdt/ConflictDetector'

function makeOp(id: string) {
  return {
    id,
    deviceId: 'dev',
    type: 'ITEM_UPDATE' as const,
    payload: { itemId: 'i1' },
    vectorClock: { dev: 1 },
    createdAt: Date.now(),
  }
}

const conflict: Conflict = { a: makeOp('op1'), b: makeOp('op2') }

describe('ConflictBanner', () => {
  it('is hidden when conflicts array is empty', () => {
    const wrapper = mount(ConflictBanner, {
      props: { conflicts: [] },
      global: { stubs: { Transition: false } },
    })
    expect(wrapper.find('[class*="bg-ctp-yellow"]').exists()).toBe(false)
  })

  it('is visible when conflicts are present', () => {
    const wrapper = mount(ConflictBanner, {
      props: { conflicts: [conflict] },
      global: { stubs: { Transition: true } },
    })
    expect(wrapper.text()).toContain('1 gleichzeitige')
  })

  it('uses plural wording for multiple conflicts', () => {
    const wrapper = mount(ConflictBanner, {
      props: { conflicts: [conflict, conflict] },
      global: { stubs: { Transition: true } },
    })
    expect(wrapper.text()).toContain('2 gleichzeitige Änderungen')
  })

  it('uses singular wording for one conflict', () => {
    const wrapper = mount(ConflictBanner, {
      props: { conflicts: [conflict] },
      global: { stubs: { Transition: true } },
    })
    expect(wrapper.text()).toContain('Änderung erkannt')
    expect(wrapper.text()).not.toContain('Änderungen erkannt')
  })

  it('emits dismiss when close button is clicked', async () => {
    const wrapper = mount(ConflictBanner, {
      props: { conflicts: [conflict] },
      global: { stubs: { Transition: true } },
    })
    await wrapper.find('button[aria-label="Schließen"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
