import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({ default: { get: mockGet, post: mockPost, delete: mockDelete } }))

import { pushService } from './push'

function makeSub(endpoint = 'https://fcm.example.com/sub') {
  return {
    endpoint,
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256', auth: 'auth' } }),
  } as unknown as PushSubscription
}

function makePushManager(existing: PushSubscription | null = null) {
  return {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(makeSub()),
  }
}

function makeRegistration(pushManager = makePushManager()) {
  return { pushManager } as unknown as ServiceWorkerRegistration
}

describe('pushService.init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { publicKey: 'AAAA' } })
    mockPost.mockResolvedValue({})
  })

  it('returns early when Notification is not in window', async () => {
    const origNotification = (global as Record<string, unknown>)['Notification']
    delete (global as Record<string, unknown>)['Notification']
    await pushService.init()
    expect(mockPost).not.toHaveBeenCalled()
    ;(global as Record<string, unknown>)['Notification'] = origNotification
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
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue(reg)
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
    const reg = makeRegistration(makePushManager(existing))
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue(reg)
    await pushService.init()
    expect(mockPost).toHaveBeenCalledWith('/push/subscribe', expect.objectContaining({
      endpoint: 'https://fcm.example.com/existing',
    }))
  })

  it('fetches vapid key and subscribes when no existing subscription', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const pm = makePushManager(null)
    const reg = makeRegistration(pm)
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue(reg)
    mockGet.mockResolvedValue({ data: { publicKey: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' } })
    await pushService.init()
    expect(mockGet).toHaveBeenCalledWith('/push/public-key')
    expect(pm.subscribe).toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalledWith('/push/subscribe', expect.any(Object))
  })

  it('does not throw when subscribeToPush fails', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockRejectedValue(new Error('SW unavailable'))
    await expect(pushService.init()).resolves.toBeUndefined()
  })
})

describe('pushService.unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDelete.mockResolvedValue({})
  })

  it('does nothing when there is no active subscription', async () => {
    const reg = makeRegistration(makePushManager(null))
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue(reg)
    await pushService.unsubscribe()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('calls DELETE /push/subscribe with endpoint and calls sub.unsubscribe()', async () => {
    const sub = makeSub('https://fcm.example.com/xyz')
    const reg = makeRegistration(makePushManager(sub))
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue(reg)
    await pushService.unsubscribe()
    expect(mockDelete).toHaveBeenCalledWith('/push/subscribe', {
      data: { endpoint: 'https://fcm.example.com/xyz' },
    })
    expect(sub.unsubscribe).toHaveBeenCalled()
  })
})
