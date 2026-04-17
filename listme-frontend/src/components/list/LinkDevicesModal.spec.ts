import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

const { mockCreateSyncToken } = vi.hoisted(() => ({
  mockCreateSyncToken: vi.fn(),
}))

vi.mock('../../services/share', () => ({
  shareService: {
    createSyncToken: mockCreateSyncToken,
  },
}))

import LinkDevicesModal from './LinkDevicesModal.vue'

function mountModal(modelValue = true) {
  return mount(LinkDevicesModal, {
    props: { modelValue },
    global: {
      stubs: { Transition: { template: '<slot />' }, Teleport: true },
    },
  })
}

async function mountAndOpen() {
  const w = mountModal(false)
  await w.setProps({ modelValue: true })
  return w
}

function stubClipboard() {
  const mockWrite = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWrite },
    writable: true,
    configurable: true,
  })
  return mockWrite
}

describe('LinkDevicesModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    Object.assign(window, { location: { origin: 'http://localhost:5173' } })
  })

  it('hidden when modelValue is false', () => {
    const w = mountModal(false)
    expect(w.find('h2').exists()).toBe(false)
  })

  it('shows title when open', () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn123', expiresAt: '2026-12-31T00:00:00Z' })
    const w = mountModal()
    expect(w.text()).toContain('Geräte verknüpfen')
  })

  it('creates sync token on open', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn123', expiresAt: '2026-12-31T00:00:00Z' })
    await mountAndOpen()
    await nextTick()
    expect(mockCreateSyncToken).toHaveBeenCalled()
  })

  it('shows syncUrl after token created', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn-abc', expiresAt: '2026-12-31T00:00:00Z' })
    const w = await mountAndOpen()
    await nextTick()
    expect(w.text()).toContain('syn-abc')
  })

  it('shows expiry date', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn-abc', expiresAt: '2026-12-31T00:00:00Z' })
    const w = await mountAndOpen()
    await nextTick()
    expect(w.text()).toContain('2026')
  })

  it('copyLink calls clipboard.writeText', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn-copy', expiresAt: '2026-12-31T00:00:00Z' })
    const mockWrite = stubClipboard()
    const w = await mountAndOpen()
    await nextTick()
    await w.find('button.w-full.py-3').trigger('click')
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('syn-copy'))
  })

  it('copied text changes after copy click', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn-copy', expiresAt: '2026-12-31T00:00:00Z' })
    stubClipboard()
    const w = await mountAndOpen()
    await nextTick()
    const copyBtn = w.find('button.w-full.py-3')
    expect(copyBtn.text()).toBe('Link kopieren')
    await copyBtn.trigger('click')
    await nextTick()
    expect(copyBtn.text()).toContain('Kopiert')
  })

  it('close button emits update:modelValue false', async () => {
    mockCreateSyncToken.mockResolvedValue({ token: 'syn123', expiresAt: '2026-12-31T00:00:00Z' })
    const w = await mountAndOpen()
    await nextTick()
    await w.find('button.w-full.mt-3').trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('shows loading skeletons while fetching token', async () => {
    mockCreateSyncToken.mockImplementation(() => new Promise(() => {})) // never resolves
    const w = await mountAndOpen()
    expect(w.find('.skeleton').exists()).toBe(true)
  })
})
