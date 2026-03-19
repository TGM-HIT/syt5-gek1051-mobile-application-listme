import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const { mockGenerate, mockRevoke } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockRevoke: vi.fn(),
}))

vi.mock('../../services/share', () => ({
  shareService: {
    generateToken: mockGenerate,
    revokeToken: mockRevoke,
  },
}))
vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn() } }))

import ShareListModal from './ShareListModal.vue'

const LIST = {
  id: 'list-1',
  name: 'Groceries',
  emoji: '🛒',
  shareToken: null as string | null,
  itemCount: 0,
  checkedCount: 0,
}

function mountModal(modelValue = true, list = LIST) {
  return mount(ShareListModal, {
    props: { modelValue, list },
    global: {
      stubs: { Transition: { template: '<slot />' }, Teleport: true },
    },
  })
}

/** Mount closed then open to trigger the modelValue watch. */
async function mountAndOpen(list = LIST) {
  const w = mountModal(false, list)
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

describe('ShareListModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(window, { location: { origin: 'http://localhost:5173' } })
  })

  it('hidden when modelValue is false', () => {
    const w = mountModal(false)
    expect(w.find('h2').exists()).toBe(false)
  })

  it('shows title when open', async () => {
    const w = mountModal()
    expect(w.text()).toContain('Liste teilen')
  })

  it('generates token on open when none exists', async () => {
    mockGenerate.mockResolvedValue({ token: 'tok123' })
    await mountAndOpen()
    await nextTick()
    expect(mockGenerate).toHaveBeenCalledWith('list-1')
  })

  it('does not generate token when one already exists', async () => {
    const listWithToken = { ...LIST, shareToken: 'existing-token' }
    await mountAndOpen(listWithToken)
    await nextTick()
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('shows shareUrl after token generated', async () => {
    mockGenerate.mockResolvedValue({ token: 'tok123' })
    const w = await mountAndOpen()
    await nextTick()
    expect(w.text()).toContain('tok123')
  })

  it('shows shareUrl when list already has token', async () => {
    const listWithToken = { ...LIST, shareToken: 'abc' }
    const w = await mountAndOpen(listWithToken)
    await nextTick()
    expect(w.text()).toContain('abc')
  })

  it('copyLink calls navigator.clipboard.writeText', async () => {
    const mockWrite = stubClipboard()
    const listWithToken = { ...LIST, shareToken: 'tok-copy' }
    const w = await mountAndOpen(listWithToken)
    await nextTick()
    await w.find('button.w-full.py-3').trigger('click')
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('tok-copy'))
  })

  it('revoke button calls shareService.revokeToken and emits token-changed null', async () => {
    mockRevoke.mockResolvedValue(undefined)
    const listWithToken = { ...LIST, shareToken: 'tok-rev' }
    const w = await mountAndOpen(listWithToken)
    await nextTick()
    const revokeBtn = w.findAll('button').find(b => b.text().includes('widerrufen'))
    await revokeBtn!.trigger('click')
    await nextTick()
    expect(mockRevoke).toHaveBeenCalledWith('list-1')
    expect(w.emitted('token-changed')).toBeTruthy()
    expect(w.emitted('token-changed')![0]).toEqual([null])
  })

  it('close button emits update:modelValue false', async () => {
    mockGenerate.mockResolvedValue({ token: 'tok' })
    const w = await mountAndOpen()
    await nextTick()
    const closeBtn = w.findAll('button').find(b => b.text() === 'Schließen')
    await closeBtn!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('QR toggle button shows/hides QR section', async () => {
    const listWithToken = { ...LIST, shareToken: 'tok-qr' }
    const w = await mountAndOpen(listWithToken)
    await nextTick()
    const qrBtn = w.findAll('button').find(b => b.text().includes('QR-Code'))
    expect(qrBtn).toBeTruthy()
    await qrBtn!.trigger('click')
    await nextTick()
    expect(w.find('canvas').exists()).toBe(true)
  })
})
