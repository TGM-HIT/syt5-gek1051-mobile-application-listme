import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelTag from './LabelTag.vue'
import type { Label } from '../../types'

function makeLabel(overrides: Partial<Label> = {}): Label {
  return { id: '1', name: 'Bio', color: null, ...overrides }
}

describe('LabelTag', () => {
  it('renders the label name', () => {
    const wrapper = mount(LabelTag, { props: { label: makeLabel({ name: 'Bio' }) } })
    expect(wrapper.text()).toBe('Bio')
  })

  it('applies color-based inline styles when color is set', () => {
    const wrapper = mount(LabelTag, {
      props: { label: makeLabel({ color: '#A6D189' }) },
    })
    const span = wrapper.find('span')
    expect(span.attributes('style')).toContain('#A6D189')
  })

  it('applies fallback class when color is null', () => {
    const wrapper = mount(LabelTag, {
      props: { label: makeLabel({ color: null }) },
    })
    const span = wrapper.find('span')
    expect(span.classes()).toContain('bg-ctp-surface1')
  })

  it('does not apply inline style when color is null', () => {
    const wrapper = mount(LabelTag, {
      props: { label: makeLabel({ color: null }) },
    })
    const style = wrapper.find('span').attributes('style')
    expect(style ?? '').toBe('')
  })
})
