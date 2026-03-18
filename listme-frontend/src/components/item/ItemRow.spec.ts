import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemRow from './ItemRow.vue'
import type { Item } from '../../types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'i1',
    listId: 'l1',
    name: 'Äpfel',
    checked: false,
    position: 0,
    categoryId: null,
    categoryName: null,
    categoryColor: null,
    quantity: null,
    quantityUnit: null,
    price: null,
    imageUrl: null,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    createdByDeviceId: null,
    ...overrides,
  }
}

describe('ItemRow', () => {
  it('renders the item name', () => {
    const wrapper = mount(ItemRow, { props: { item: makeItem({ name: 'Bananen' }) } })
    expect(wrapper.text()).toContain('Bananen')
  })

  it('renders quantity with unit when both set', () => {
    const wrapper = mount(ItemRow, {
      props: { item: makeItem({ quantity: 3, quantityUnit: 'kg' }) },
    })
    expect(wrapper.text()).toContain('3 kg')
  })

  it('renders quantity without unit when unit is null', () => {
    const wrapper = mount(ItemRow, {
      props: { item: makeItem({ quantity: 5, quantityUnit: null }) },
    })
    expect(wrapper.text()).toContain('5')
  })

  it('renders price when set', () => {
    const wrapper = mount(ItemRow, {
      props: { item: makeItem({ price: 1.99 }) },
    })
    expect(wrapper.text()).toContain('1.99')
  })

  it('renders category name when set', () => {
    const wrapper = mount(ItemRow, {
      props: { item: makeItem({ categoryName: 'Obst', categoryColor: null }) },
    })
    expect(wrapper.text()).toContain('Obst')
  })

  it('shows thumbnail image when imageUrl is set', () => {
    const wrapper = mount(ItemRow, {
      props: { item: makeItem({ imageUrl: 'https://example.com/apfel.jpg' }) },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/apfel.jpg')
  })

  it('does not render image when imageUrl is null', () => {
    const wrapper = mount(ItemRow, { props: { item: makeItem({ imageUrl: null }) } })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('applies opacity class when item is checked', () => {
    const wrapper = mount(ItemRow, { props: { item: makeItem({ checked: true }) } })
    expect(wrapper.find('div').classes()).toContain('opacity-50')
  })

  it('does not apply opacity class when item is unchecked', () => {
    const wrapper = mount(ItemRow, { props: { item: makeItem({ checked: false }) } })
    expect(wrapper.find('div').classes()).not.toContain('opacity-50')
  })

  it('emits toggle with item id when checkbox is clicked', async () => {
    const item = makeItem({ id: 'item-42' })
    const wrapper = mount(ItemRow, { props: { item } })
    await wrapper.find('button[aria-label]').trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([['item-42']])
  })

  it('emits edit with item when edit button is clicked', async () => {
    const item = makeItem()
    const wrapper = mount(ItemRow, { props: { item } })
    const buttons = wrapper.findAll('button')
    // Second button (after checkbox) is edit
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('edit')).toBeDefined()
    expect(wrapper.emitted('edit')![0]).toEqual([item])
  })

  it('emits delete with item id when delete button is clicked', async () => {
    const item = makeItem({ id: 'del-99' })
    const wrapper = mount(ItemRow, { props: { item } })
    const buttons = wrapper.findAll('button')
    // Third button is delete
    await buttons[2]!.trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['del-99']])
  })
})
