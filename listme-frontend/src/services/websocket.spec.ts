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
    /** Set to false to simulate a failed connection attempt (no onConnect fires). */
    shouldConnect: true,
    onConnect: null as ((frame: unknown) => void) | null,
    onDisconnect: null as (() => void) | null,
  },
}))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    get connected() { return wsState.connected }
    set onConnect(fn: (frame: unknown) => void) { wsState.onConnect = fn }
    set onDisconnect(fn: () => void) { wsState.onDisconnect = fn }
    set onWebSocketError(_fn: unknown) {}
    set onStompError(_fn: unknown) {}
    set reconnectDelay(_v: unknown) {}
    activate() {
      mockFns.activate()
      if (wsState.shouldConnect) {
        wsState.connected = true
        wsState.onConnect?.(null)
      }
    }
    deactivate() {
      mockFns.deactivate()
      wsState.connected = false
    }
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
  reconnectAttempt,
  wsConnected,
  onReconnect,
} from './websocket'

describe('websocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsState.connected = false
    wsState.shouldConnect = true
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

  // ── exponential backoff & reconnect ────────────────────────────────────

  it('reconnectAttempt is 0 initially', () => {
    expect(reconnectAttempt.value).toBe(0)
  })

  it('reconnectAttempt increments when onDisconnect fires', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    wsState.onDisconnect?.()
    expect(reconnectAttempt.value).toBe(1)
    vi.useRealTimers()
  })

  it('reconnectAttempt resets to 0 after successful reconnect', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    wsState.onDisconnect?.()
    expect(reconnectAttempt.value).toBe(1)
    // Simulate timer firing → activate → onConnect
    await vi.runAllTimersAsync()
    expect(reconnectAttempt.value).toBe(0)
    vi.useRealTimers()
  })

  it('schedules reconnect with exponential delay (1s on first attempt)', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    const activateCount = mockFns.activate.mock.calls.length

    wsState.onDisconnect?.()
    // No immediate reconnect
    expect(mockFns.activate.mock.calls.length).toBe(activateCount)
    // After 1000ms → reconnect fires
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFns.activate.mock.calls.length).toBe(activateCount + 1)
    vi.useRealTimers()
  })

  it('second disconnect attempt doubles the delay (2s) when reconnect fails', async () => {
    vi.useFakeTimers()

    await connectWebSocket()
    const initialCount = mockFns.activate.mock.calls.length

    // Reconnect attempts will fail (server still down — no onConnect fires)
    wsState.shouldConnect = false

    // First disconnect → attempt=1, timer=1s
    wsState.onDisconnect?.()
    expect(reconnectAttempt.value).toBe(1)

    // Timer fires after 1s → activate (reconnect attempt 1, fails silently)
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFns.activate.mock.calls.length).toBe(initialCount + 1)

    // Simulate reconnect failed → disconnect again → attempt=2, timer=2s
    wsState.onDisconnect?.()
    expect(reconnectAttempt.value).toBe(2)

    const countAt2 = mockFns.activate.mock.calls.length
    // After 1s — should NOT fire yet (delay is 2s)
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFns.activate.mock.calls.length).toBe(countAt2)
    // After another 1s (total 2s) — fires
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFns.activate.mock.calls.length).toBe(countAt2 + 1)

    vi.useRealTimers()
  })

  it('onReconnect callback fires after reconnect, not initial connect', async () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    onReconnect(cb)

    await connectWebSocket()
    expect(cb).not.toHaveBeenCalled() // initial connect → no callback

    wsState.onDisconnect?.()
    await vi.runAllTimersAsync() // reconnect fires
    expect(cb).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('onReconnect unregister stops future callbacks', async () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const unregister = onReconnect(cb)
    unregister()

    await connectWebSocket()
    wsState.onDisconnect?.()
    await vi.runAllTimersAsync()
    expect(cb).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  // ── wsConnected reactive ref ───────────────────────────────────────────────

  it('wsConnected is false before connecting', () => {
    expect(wsConnected.value).toBe(false)
  })

  it('wsConnected becomes true after onConnect fires', async () => {
    await connectWebSocket()
    expect(wsConnected.value).toBe(true)
  })

  it('wsConnected becomes false after onDisconnect fires', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    expect(wsConnected.value).toBe(true)
    wsState.onDisconnect?.()
    expect(wsConnected.value).toBe(false)
    vi.useRealTimers()
  })

  it('wsConnected becomes true again after successful reconnect', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    wsState.onDisconnect?.()
    expect(wsConnected.value).toBe(false)
    await vi.runAllTimersAsync() // backoff fires → onConnect → wsConnected = true
    expect(wsConnected.value).toBe(true)
    vi.useRealTimers()
  })

  it('wsConnected is false after disconnectWebSocket()', async () => {
    await connectWebSocket()
    expect(wsConnected.value).toBe(true)
    disconnectWebSocket()
    expect(wsConnected.value).toBe(false)
  })

  it('disconnectWebSocket clears pending reconnect timer', async () => {
    vi.useFakeTimers()
    await connectWebSocket()
    wsState.onDisconnect?.()
    expect(reconnectAttempt.value).toBe(1)

    disconnectWebSocket()
    expect(reconnectAttempt.value).toBe(0)

    // Timer should be cleared — no extra activate after disconnect
    const countAfterDisconnect = mockFns.activate.mock.calls.length
    await vi.runAllTimersAsync()
    expect(mockFns.activate.mock.calls.length).toBe(countAfterDisconnect)
    vi.useRealTimers()
  })
})
