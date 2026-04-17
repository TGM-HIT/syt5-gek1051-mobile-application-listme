import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({ default: { get: mockGet, post: mockPost, delete: mockDelete } }))

import { pushService } from './push'

// ── helpers ─────────────────────────────────────────────────────────────────

function makeSub(endpoint = 'https://fcm.example.com/sub') {
  return {
    endpoint,
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256', auth: 'auth' } }),
  } as unknown as PushSubscription
}

function stubServiceWorker(readyValue: ServiceWorkerRegistration | Promise<never>) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    get: () => ({ ready: Promise.resolve(readyValue) }),
  })
}

function makeRegistration(existing: PushSubscription | null = null) {
  const subscribe = vi.fn().mockResolvedValue(makeSub())
  const getSubscription = vi.fn().mockResolvedValue(existing)
  return {
    pushManager: { getSubscription, subscribe },
    _subscribe: subscribe,
  } as unknown as ServiceWorkerRegistration & { _subscribe: ReturnType<typeof vi.fn> }
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('pushService.init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { publicKey: 'AAAA' } })
    mockPost.mockResolvedValue({})
    vi.stubGlobal('PushManager', class {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns early when Notification is not in window', async () => {
    const orig = (global as Record<string, unknown>)['Notification']
    delete (global as Record<string, unknown>)['Notification']
    await pushService.init()
    expect(mockPost).not.toHaveBeenCalled()
    ;(global as Record<string, unknown>)['Notification'] = orig
  })

  it('returns early when permission is denied', async () => {
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() })
    await pushService.init()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('requests permission when it is default', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    const reg = makeRegistration()
    stubServiceWorker(reg)
    await pushService.init()
    expect(requestPermission).toHaveBeenCalled()
  })

  it('returns early when user denies permission prompt', async () => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    await pushService.init()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('re-sends existing subscription to backend when one exists', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const existing = makeSub('https://fcm.example.com/existing')
    const reg = makeRegistration(existing)
    stubServiceWorker(reg)
    await pushService.init()
    expect(mockPost).toHaveBeenCalledWith('/push/subscribe', expect.objectContaining({
      endpoint: 'https://fcm.example.com/existing',
    }))
  })

  it('fetches vapid key and creates new subscription when none exists', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    mockGet.mockResolvedValue({ data: { publicKey: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' } })
    const reg = makeRegistration(null)
    stubServiceWorker(reg)
    await pushService.init()
    expect(mockGet).toHaveBeenCalledWith('/push/public-key')
    expect((reg as unknown as { _subscribe: ReturnType<typeof vi.fn> })._subscribe).toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalledWith('/push/subscribe', expect.any(Object))
  })

  it('does not throw when subscribeToPush fails', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      get: () => ({ ready: Promise.reject(new Error('SW unavailable')) }),
    })
    await expect(pushService.init()).resolves.toBeUndefined()
  })
})

describe('pushService.unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDelete.mockResolvedValue({})
    vi.stubGlobal('PushManager', class {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing when there is no active subscription', async () => {
    const reg = makeRegistration(null)
    stubServiceWorker(reg)
    await pushService.unsubscribe()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('calls DELETE /push/subscribe and sub.unsubscribe()', async () => {
    const sub = makeSub('https://fcm.example.com/xyz')
    const reg = makeRegistration(sub)
    stubServiceWorker(reg)
    await pushService.unsubscribe()
    expect(mockDelete).toHaveBeenCalledWith('/push/subscribe', {
      data: { endpoint: 'https://fcm.example.com/xyz' },
    })
    expect(sub.unsubscribe).toHaveBeenCalled()
  })
})
