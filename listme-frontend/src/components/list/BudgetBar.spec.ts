import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { BudgetSummary } from '../../types'

const { mockBudgetGet } = vi.hoisted(() => ({
  mockBudgetGet: vi.fn(),
}))

vi.mock('../../services/budget', () => ({
  budgetService: { get: mockBudgetGet },
}))

import BudgetBar from './BudgetBar.vue'

function makeBudget(overrides: Partial<BudgetSummary> = {}): BudgetSummary {
  return { total: 10.5, byCategory: { Obst: 5.0, Gemüse: 5.5 }, ...overrides }
}

describe('BudgetBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when budget total is 0', async () => {
    mockBudgetGet.mockResolvedValue({ total: 0, byCategory: {} })
    const wrapper = mount(BudgetBar, { props: { listId: 'l1', itemsVersion: 1 } })
    await flushPromises()
    expect(wrapper.find('[class*="bg-ctp-surface0"]').exists()).toBe(false)
  })

  it('renders nothing when service rejects', async () => {
    mockBudgetGet.mockRejectedValue(new Error('fail'))
    const wrapper = mount(BudgetBar, { props: { listId: 'l1', itemsVersion: 1 } })
    await flushPromises()
    expect(wrapper.find('[class*="bg-ctp-surface0"]').exists()).toBe(false)
  })

  it('shows total when budget has items', async () => {
    mockBudgetGet.mockResolvedValue(makeBudget({ total: 12.49 }))
    const wrapper = mount(BudgetBar, {
      props: { listId: 'l1', itemsVersion: 1 },
      global: { stubs: { Transition: true } },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('12.49')
  })

  it('breakdown is hidden before toggle', async () => {
    mockBudgetGet.mockResolvedValue(makeBudget())
    const wrapper = mount(BudgetBar, {
      props: { listId: 'l1', itemsVersion: 1 },
      global: { stubs: { Transition: true } },
    })
    await flushPromises()
    // Category breakdown should not be visible initially (expanded = false)
    expect(wrapper.text()).not.toContain('Obst')
  })

  it('breakdown appears after clicking toggle button', async () => {
    mockBudgetGet.mockResolvedValue(makeBudget())
    const wrapper = mount(BudgetBar, {
      props: { listId: 'l1', itemsVersion: 1 },
      global: { stubs: { Transition: false } },
    })
    await flushPromises()
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Obst')
    expect(wrapper.text()).toContain('Gemüse')
  })

  it('reloads when itemsVersion changes', async () => {
    mockBudgetGet.mockResolvedValue(makeBudget({ total: 5.0 }))
    const wrapper = mount(BudgetBar, {
      props: { listId: 'l1', itemsVersion: 1 },
      global: { stubs: { Transition: true } },
    })
    await flushPromises()
    expect(mockBudgetGet).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ itemsVersion: 2 })
    await flushPromises()
    expect(mockBudgetGet).toHaveBeenCalledTimes(2)
  })
})
