import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ListSection from './ListSection.vue'

describe('ListSection', () => {
  it('renders the title', () => {
    const wrapper = mount(ListSection, { props: { title: 'Meine Listen', count: 3 } })
    expect(wrapper.text()).toContain('Meine Listen')
  })

  it('renders the count', () => {
    const wrapper = mount(ListSection, { props: { title: 'Meine Listen', count: 5 } })
    expect(wrapper.text()).toContain('5')
  })

  it('renders slot content', () => {
    const wrapper = mount(ListSection, {
      props: { title: 'Test', count: 1 },
      slots: { default: '<div data-testid="child">Inhalt</div>' },
    })
    expect(wrapper.find('[data-testid="child"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="child"]').text()).toBe('Inhalt')
  })

  it('renders zero count', () => {
    const wrapper = mount(ListSection, { props: { title: 'Leer', count: 0 } })
    expect(wrapper.text()).toContain('0')
  })
})
