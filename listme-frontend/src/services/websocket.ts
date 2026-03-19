import { Client, type StompSubscription } from '@stomp/stompjs'
import { ref } from 'vue'
import { getDeviceId } from './device'

type MessageCallback = (body: unknown) => void

let client: Client | null = null
let deviceId: string | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let attempt = 0
let hasConnectedOnce = false

/** Current reconnect attempt number (0 = connected, >0 = retrying). */
export const reconnectAttempt = ref(0)

const reconnectListeners: Array<() => void> = []

/**
 * Register a callback that fires every time the WebSocket reconnects after
 * a drop. Returns an unregister function.
 */
export function onReconnect(cb: () => void): () => void {
  reconnectListeners.push(cb)
  return () => {
    const idx = reconnectListeners.indexOf(cb)
    if (idx !== -1) reconnectListeners.splice(idx, 1)
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null) return
  attempt++
  reconnectAttempt.value = attempt
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
  const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30_000)
  console.debug(`[WS] reconnecting in ${delay}ms (attempt ${attempt})`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    client?.activate()
  }, delay)
}

/** Connect to the STOMP broker. Idempotent — safe to call multiple times. */
export async function connectWebSocket(): Promise<void> {
  if (client?.connected) return

  deviceId ??= await getDeviceId()

  // Client already exists (called again before backoff fires) — just activate
  if (client) {
    if (!client.connected) client.activate()
    return
  }

  return new Promise<void>((resolve, reject) => {
    client = new Client({ brokerURL: buildBrokerUrl(deviceId!) })
    client.reconnectDelay = 0 // manual exponential backoff via scheduleReconnect

    client.onConnect = () => {
      console.debug('[WS] connected')
      const isReconnect = hasConnectedOnce
      hasConnectedOnce = true
      attempt = 0
      reconnectAttempt.value = 0
      if (isReconnect) reconnectListeners.forEach(cb => cb())
      resolve() // no-op if already resolved
    }

    client.onDisconnect = () => {
      console.debug('[WS] disconnected')
      scheduleReconnect()
    }

    client.onStompError = (frame) => {
      console.error('[WS] STOMP error', frame)
      if (!hasConnectedOnce) reject(new Error('STOMP error'))
    }

    client.onWebSocketError = (err) => {
      console.error('[WS] WebSocket error', err)
      if (!hasConnectedOnce) reject(err)
      // After first connect, errors trigger onDisconnect → scheduleReconnect
    }

    client.activate()
  })
}

export function disconnectWebSocket(): void {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  attempt = 0
  reconnectAttempt.value = 0
  hasConnectedOnce = false
  client?.deactivate()
  client = null
}

export function isConnected(): boolean {
  return client?.connected ?? false
}

/**
 * Subscribe to a STOMP topic.
 * Returns an unsubscribe function.
 */
export function subscribe(topic: string, callback: MessageCallback): () => void {
  if (!client?.connected) {
    console.warn('[WS] subscribe called before connected, topic:', topic)
    return () => {}
  }
  const sub: StompSubscription = client.subscribe(topic, (msg) => {
    try {
      callback(JSON.parse(msg.body))
    } catch {
      callback(msg.body)
    }
  })
  return () => sub.unsubscribe()
}

/** Send a message to a STOMP destination. */
export function send(destination: string, body: unknown = ''): void {
  if (!client?.connected) return
  client.publish({
    destination,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function buildBrokerUrl(deviceId: string): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${location.host}/ws/websocket?deviceId=${deviceId}`
}
