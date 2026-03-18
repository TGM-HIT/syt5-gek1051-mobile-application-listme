import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Preset } from '../../services/preset'

const { mockPresetGetAll } = vi.hoisted(() => ({
  mockPresetGetAll: vi.fn(),
}))

vi.mock('../../services/preset', () => ({
  presetService: { getAll: mockPresetGetAll },
}))

import AddListModal from './AddListModal.vue'

function makePreset(overrides: Partial<Preset> = {}): Preset {
  return {
    id: 'p1',
    name: 'Wochenvorlage',
    emoji: '📋',
    itemCount: 5,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('AddListModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPresetGetAll.mockResolvedValue([])
  })

  it('is not visible when open is false', () => {
    const wrapper = mount(AddListModal, {
      props: { open: false },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders name input when open is true', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('create button is disabled when name is empty', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Erstellen'))
    expect(createBtn?.attributes('disabled')).toBeDefined()
  })

  it('emits create with name and emoji when submitted', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    const input = wrapper.find('input[type="text"]')
    await input.setValue('Meine Liste')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Erstellen'))!
    await createBtn.trigger('click')
    const emitted = wrapper.emitted('create')
    expect(emitted).toBeDefined()
    expect(emitted![0][0]).toBe('Meine Liste')
    expect(typeof emitted![0][1]).toBe('string') // emoji
  })

  it('emits close after create', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    await wrapper.find('input[type="text"]').setValue('Test')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Erstellen'))!
    await createBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('emits close when cancel is clicked', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Abbrechen'))!
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('changes selected emoji when emoji button is clicked', async () => {
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    // Click second emoji button (🏠)
    const emojiBtns = wrapper.findAll('button').filter(b => b.text().length <= 2)
    await emojiBtns[1]!.trigger('click')
    // The selected emoji class should be on a button now
    const selected = wrapper.findAll('button').find(b =>
      b.classes().some(c => c.includes('border-ctp-teal'))
    )
    expect(selected).toBeDefined()
  })

  it('shows preset picker when presets are available', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset()])
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Von Vorlage starten')
    expect(wrapper.text()).toContain('Wochenvorlage')
  })

  it('hides preset picker when no presets exist', async () => {
    mockPresetGetAll.mockResolvedValue([])
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Von Vorlage starten')
  })

  it('create button shows "Aus Vorlage" text when preset is selected', async () => {
    mockPresetGetAll.mockResolvedValue([makePreset()])
    const wrapper = mount(AddListModal, {
      props: { open: true },
      global: { stubs: { Teleport: true, Transition: true } },
    })
    await flushPromises()
    // Click the preset button
    const presetBtn = wrapper.findAll('button').find(b => b.text().includes('Wochenvorlage'))!
    await presetBtn.trigger('click')
    const createBtn = wrapper.findAll('button').find(b =>
      b.text().includes('Aus Vorlage') || b.text().includes('Erstellen')
    )
    expect(createBtn?.text()).toContain('Aus Vorlage')
  })
})
