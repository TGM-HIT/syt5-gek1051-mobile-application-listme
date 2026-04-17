import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VoiceInput from './VoiceInput.vue'

// ---------------------------------------------------------------------------
// SpeechRecognition mock factory
// ---------------------------------------------------------------------------
function makeSRMock() {
  const instance = {
    lang: '',
    interimResults: true,
    maxAlternatives: 1,
    onresult: null as ((e: any) => void) | null,
    onerror: null as (() => void) | null,
    onend: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(),
  }
  const ctor = vi.fn(() => instance)
  return { ctor, instance }
}

function mountSupported(size?: 'sm' | 'md') {
  const { ctor, instance } = makeSRMock()
  Object.defineProperty(window, 'SpeechRecognition', { value: ctor, writable: true, configurable: true })
  Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, writable: true, configurable: true })
  const w = mount(VoiceInput, { props: size ? { size } : {} })
  return { w, ctor, instance }
}

function mountUnsupported() {
  Object.defineProperty(window, 'SpeechRecognition', { value: undefined, writable: true, configurable: true })
  Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, writable: true, configurable: true })
  return mount(VoiceInput)
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------

describe('VoiceInput — supported browser', () => {
  it('renders an enabled button', () => {
    const { w } = mountSupported()
    expect(w.find('button').attributes('disabled')).toBeUndefined()
  })

  it('starts recognition on first click', async () => {
    const { w, ctor, instance } = mountSupported()
    await w.find('button').trigger('click')
    expect(ctor).toHaveBeenCalledOnce()
    expect(instance.start).toHaveBeenCalledOnce()
  })

  it('sets lang to de-DE', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    expect(instance.lang).toBe('de-DE')
  })

  it('sets interimResults to false', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    expect(instance.interimResults).toBe(false)
  })

  it('emits result with transcript on onresult', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    instance.onresult!({ results: [[{ transcript: 'Milch' }]] })
    expect(w.emitted('result')).toEqual([['Milch']])
  })

  it('emits error on onerror and resets listening state', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    instance.onerror!()
    await nextTick()
    expect(w.emitted('error')).toEqual([['Spracheingabe fehlgeschlagen']])
    expect(w.find('button').classes()).not.toContain('bg-ctp-red')
  })

  it('resets listening state on onend', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    expect(w.find('button').classes()).toContain('bg-ctp-red')
    instance.onend!()
    await nextTick()
    expect(w.find('button').classes()).not.toContain('bg-ctp-red')
  })

  it('stops recognition on second click', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    await w.find('button').trigger('click')
    expect(instance.stop).toHaveBeenCalledOnce()
  })

  it('shows pulse ring while listening', async () => {
    const { w } = mountSupported()
    await w.find('button').trigger('click')
    expect(w.find('span.animate-ping').exists()).toBe(true)
  })

  it('hides pulse ring when not listening', () => {
    const { w } = mountSupported()
    expect(w.find('span.animate-ping').exists()).toBe(false)
  })

  it('calls stop on unmount while recording', async () => {
    const { w, instance } = mountSupported()
    await w.find('button').trigger('click')
    w.unmount()
    expect(instance.stop).toHaveBeenCalled()
  })
})

describe('VoiceInput — size prop', () => {
  it('applies sm size classes by default', () => {
    const { w } = mountSupported()
    expect(w.find('button').classes()).toContain('w-9')
    expect(w.find('button').classes()).toContain('h-9')
  })

  it('applies md size classes when size=md', () => {
    const { w } = mountSupported('md')
    expect(w.find('button').classes()).toContain('w-10')
    expect(w.find('button').classes()).toContain('h-10')
  })
})

describe('VoiceInput — unsupported browser', () => {
  it('renders a disabled button', () => {
    const w = mountUnsupported()
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })

  it('does not start recognition on click', async () => {
    const w = mountUnsupported()
    await w.find('button').trigger('click')
    expect(w.emitted('result')).toBeFalsy()
    expect(w.emitted('error')).toBeFalsy()
  })

  it('has "not-allowed" cursor class', () => {
    const w = mountUnsupported()
    expect(w.find('button').classes()).toContain('cursor-not-allowed')
  })
})

describe('VoiceInput — webkitSpeechRecognition fallback', () => {
  it('uses webkitSpeechRecognition when SpeechRecognition is absent', async () => {
    const { ctor, instance } = makeSRMock()
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: ctor, writable: true, configurable: true })
    const w = mount(VoiceInput)
    await w.find('button').trigger('click')
    expect(instance.start).toHaveBeenCalledOnce()
  })
})
