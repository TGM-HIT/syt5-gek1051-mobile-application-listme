import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockFns, wsState } = vi.hoisted(() => ({
  mockFns: {
    activate: vi.fn(),
    deactivate: vi.fn(),
    subscribe: vi.fn(),
    publish: vi.fn(),
  },
  wsState: {
    connected: false,
    onConnect: null as ((frame: unknown) => void) | null,
  },
}))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    get connected() { return wsState.connected }
    set onConnect(fn: (frame: unknown) => void) { wsState.onConnect = fn }
    set onWebSocketError(_fn: unknown) {}
    activate() {
      mockFns.activate()
      wsState.connected = true
      wsState.onConnect?.(null)
    }
    deactivate() { mockFns.deactivate() }
    subscribe(topic: string, cb: (msg: unknown) => void) { return mockFns.subscribe(topic, cb) }
    publish(opts: unknown) { mockFns.publish(opts) }
  },
}))

vi.mock('./device', () => ({
  getDeviceId: vi.fn().mockResolvedValue('test-device-id'),
}))

import {
  connectWebSocket,
  disconnectWebSocket,
  isConnected,
  subscribe,
  send,
} from './websocket'

describe('websocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsState.connected = false
    wsState.onConnect = null
    disconnectWebSocket()
  })

  it('isConnected returns false before connecting', () => {
    expect(isConnected()).toBe(false)
  })

  it('connectWebSocket activates the STOMP client', async () => {
    await connectWebSocket()
    expect(mockFns.activate).toHaveBeenCalled()
  })

  it('isConnected returns true after connect', async () => {
    await connectWebSocket()
    expect(isConnected()).toBe(true)
  })

  it('connectWebSocket is idempotent — activates only once', async () => {
    await connectWebSocket()
    await connectWebSocket()
    expect(mockFns.activate).toHaveBeenCalledTimes(1)
  })

  it('subscribe returns noop when not connected', () => {
    const unsub = subscribe('/topic/test', vi.fn())
    expect(typeof unsub).toBe('function')
    unsub() // should not throw
  })

  it('subscribe registers callback when connected', async () => {
    await connectWebSocket()
    const mockUnsub = { unsubscribe: vi.fn() }
    mockFns.subscribe.mockReturnValue(mockUnsub)
    const unsub = subscribe('/topic/test', vi.fn())
    expect(mockFns.subscribe).toHaveBeenCalledWith('/topic/test', expect.any(Function))
    unsub()
    expect(mockUnsub.unsubscribe).toHaveBeenCalled()
  })

  it('send does nothing when not connected', () => {
    send('/app/test', { data: 1 })
    expect(mockFns.publish).not.toHaveBeenCalled()
  })

  it('send publishes JSON payload when connected', async () => {
    await connectWebSocket()
    send('/app/test', { data: 1 })
    expect(mockFns.publish).toHaveBeenCalledWith({
      destination: '/app/test',
      body: '{"data":1}',
    })
  })

  it('send passes string body as-is', async () => {
    await connectWebSocket()
    send('/app/test', 'hello')
    expect(mockFns.publish).toHaveBeenCalledWith({ destination: '/app/test', body: 'hello' })
  })

  it('disconnectWebSocket deactivates client and clears ref', async () => {
    await connectWebSocket()
    disconnectWebSocket()
    expect(mockFns.deactivate).toHaveBeenCalled()
  })
})
