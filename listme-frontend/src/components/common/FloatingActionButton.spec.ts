import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FloatingActionButton from './FloatingActionButton.vue'

describe('FloatingActionButton', () => {
  it('renders a button', () => {
    const w = mount(FloatingActionButton)
    expect(w.find('button').exists()).toBe(true)
  })

  it('has aria-label "Liste erstellen"', () => {
    const w = mount(FloatingActionButton)
    expect(w.find('button').attributes('aria-label')).toBe('Liste erstellen')
  })

  it('emits click event when button is clicked', async () => {
    const w = mount(FloatingActionButton)
    await w.find('button').trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('renders plus icon SVG', () => {
    const w = mount(FloatingActionButton)
    expect(w.find('svg').exists()).toBe(true)
  })
})
