import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}))

import { subscribeToPush, unsubscribeFromPush } from './pushNotification'

// ── helpers ─────────────────────────────────────────────────────────────────

function makePushSubscription(endpoint = 'https://push.example.com/sub123'): PushSubscription {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256dhKey==', auth: 'authKey==' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription
}

function setupPushManager(options: {
  permissionResult?: NotificationPermission
  existingSubscription?: PushSubscription | null
  newSubscription?: PushSubscription
}) {
  const {
    permissionResult = 'granted',
    existingSubscription = null,
    newSubscription = makePushSubscription(),
  } = options

  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: {
      permission: permissionResult,
      requestPermission: vi.fn().mockResolvedValue(permissionResult),
    },
  })

  const mockSubscribe = vi.fn().mockResolvedValue(newSubscription)
  const mockGetSubscription = vi.fn().mockResolvedValue(existingSubscription)

  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: mockGetSubscription,
          subscribe: mockSubscribe,
        },
      }),
    },
  })

  return { mockSubscribe, mockGetSubscription }
}

// ── subscribeToPush ──────────────────────────────────────────────────────────

describe('subscribeToPush', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: 'BPublicVapidKey==' })
    mockPost.mockResolvedValue({})
  })

  it('does nothing if serviceWorker is not supported', async () => {
    const orig = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', { writable: true, value: undefined })
    await subscribeToPush()
    expect(mockPost).not.toHaveBeenCalled()
    Object.defineProperty(navigator, 'serviceWorker', { writable: true, value: orig })
  })

  it('does nothing if PushManager is not in window', async () => {
    const orig = (window as unknown as Record<string, unknown>).PushManager
    delete (window as unknown as Record<string, unknown>).PushManager
    await subscribeToPush()
    expect(mockPost).not.toHaveBeenCalled()
    ;(window as unknown as Record<string, unknown>).PushManager = orig
  })

  it('does nothing if notification permission is denied', async () => {
    setupPushManager({ permissionResult: 'denied' })
    ;(window.Notification as unknown as { requestPermission: () => Promise<string> }).requestPermission =
      vi.fn().mockResolvedValue('denied')
    await subscribeToPush()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('syncs existing subscription with backend without re-subscribing', async () => {
    const existing = makePushSubscription()
    const { mockSubscribe } = setupPushManager({ existingSubscription: existing })
    await subscribeToPush()
    expect(mockSubscribe).not.toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalledWith('/notifications/subscribe', {
      endpoint: existing.endpoint,
      p256dh: 'p256dhKey==',
      auth: 'authKey==',
    })
  })

  it('fetches VAPID key and creates new subscription when none exists', async () => {
    const sub = makePushSubscription('https://push.example.com/new')
    const { mockSubscribe } = setupPushManager({ existingSubscription: null, newSubscription: sub })
    await subscribeToPush()
    expect(mockGet).toHaveBeenCalledWith('/notifications/vapid-public-key')
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    )
    expect(mockPost).toHaveBeenCalledWith('/notifications/subscribe', {
      endpoint: sub.endpoint,
      p256dh: 'p256dhKey==',
      auth: 'authKey==',
    })
  })
})

// ── unsubscribeFromPush ──────────────────────────────────────────────────────

describe('unsubscribeFromPush', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDelete.mockResolvedValue({})
  })

  it('does nothing if serviceWorker is not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { writable: true, value: undefined })
    await unsubscribeFromPush()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('does nothing if there is no existing subscription', async () => {
    setupPushManager({ existingSubscription: null })
    await unsubscribeFromPush()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('calls DELETE endpoint and unsubscribes when subscription exists', async () => {
    const sub = makePushSubscription()
    setupPushManager({ existingSubscription: sub })
    await unsubscribeFromPush()
    expect(mockDelete).toHaveBeenCalledWith(
      '/notifications/subscribe',
      expect.objectContaining({ data: expect.objectContaining({ endpoint: sub.endpoint }) }),
    )
    expect(sub.unsubscribe).toHaveBeenCalled()
  })
})
