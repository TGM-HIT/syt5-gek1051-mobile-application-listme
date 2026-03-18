import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelPicker from './LabelPicker.vue'
import type { Label } from '../../types'

const labels: Label[] = [
  { id: 'l1', name: 'Bio', color: '#A6D189' },
  { id: 'l2', name: 'Vegan', color: null },
  { id: 'l3', name: 'Sale', color: '#EF9F76' },
]

describe('LabelPicker', () => {
  it('renders all label names', () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: [] } })
    expect(w.text()).toContain('Bio')
    expect(w.text()).toContain('Vegan')
    expect(w.text()).toContain('Sale')
  })

  it('renders nothing when labels array is empty', () => {
    const w = mount(LabelPicker, { props: { labels: [], selectedIds: [] } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('emits update:selectedIds with toggled id when button clicked', async () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: [] } })
    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('update:selectedIds')).toEqual([[['l1']]])
  })

  it('removes id from selection on second click', async () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: ['l1'] } })
    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('update:selectedIds')).toEqual([[[]]])
  })

  it('applies color style to selected label', () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: ['l1'] } })
    const btn = w.findAll('button')[0]!
    expect(btn.attributes('style')).toContain('#A6D189')
  })

  it('applies fallback class to uncolored label', () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: [] } })
    const btn = w.findAll('button')[1]! // Vegan has no color
    expect(btn.classes()).toContain('bg-ctp-surface0')
  })

  it('shows selected fallback class for uncolored selected label', () => {
    const w = mount(LabelPicker, { props: { labels, selectedIds: ['l2'] } })
    const btn = w.findAll('button')[1]! // Vegan selected
    expect(btn.classes()).toContain('bg-ctp-surface2')
  })
})
