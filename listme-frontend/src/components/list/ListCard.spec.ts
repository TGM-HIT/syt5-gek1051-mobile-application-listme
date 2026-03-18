import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList } from '../../types'

const mockPush = vi.fn()
const mockDuplicate = vi.fn()
const mockRemove = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../../stores/lists', () => ({
  useListsStore: () => ({
    duplicate: mockDuplicate,
    remove: mockRemove,
  }),
}))

// Import after mocks
import ListCard from './ListCard.vue'

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'l1',
    name: 'Wocheneinkauf',
    emoji: '🛒',
    shareToken: null,
    itemCount: 4,
    checkedCount: 2,
    participantCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('ListCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders list name', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ name: 'Wocheneinkauf' }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).toContain('Wocheneinkauf')
  })

  it('renders list emoji', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ emoji: '🥦' }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).toContain('🥦')
  })

  it('renders correct progress percentage', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ itemCount: 4, checkedCount: 2 }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).toContain('50%')
  })

  it('renders 0% when itemCount is 0', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ itemCount: 0, checkedCount: 0 }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).toContain('0%')
  })

  it('uses teal accent for index 0', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList(), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    const article = wrapper.find('article')
    expect(article.classes().some(c => c.includes('teal'))).toBe(true)
  })

  it('uses green accent for index 1', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList(), index: 1 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    const article = wrapper.find('article')
    expect(article.classes().some(c => c.includes('green'))).toBe(true)
  })

  it('uses sapphire accent for index 2', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList(), index: 2 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    const article = wrapper.find('article')
    expect(article.classes().some(c => c.includes('sapphire'))).toBe(true)
  })

  it('navigates to list detail on click', async () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ id: 'abc' }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await wrapper.find('article').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'list-detail', params: { id: 'abc' } })
  })

  it('shows participant count chip for shared lists', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ participantCount: 3 }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).toContain('3 Teilnehmer')
  })

  it('hides participant chip for single-device lists', () => {
    const wrapper = mount(ListCard, {
      props: { list: makeList({ participantCount: 1 }), index: 0 },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.text()).not.toContain('Teilnehmer')
  })
})
