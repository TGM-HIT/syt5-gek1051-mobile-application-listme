import { Client, type StompSubscription } from '@stomp/stompjs'
import { getDeviceId } from './device'

type MessageCallback = (body: unknown) => void

let client: Client | null = null
let deviceId: string | null = null

/** Connect to the STOMP broker. Idempotent — safe to call multiple times. */
export async function connectWebSocket(): Promise<void> {
  if (client?.connected) return

  deviceId = await getDeviceId()

  client = new Client({
    brokerURL: buildBrokerUrl(deviceId),
    reconnectDelay: 1000,
    onConnect: () => console.debug('[WS] connected'),
    onDisconnect: () => console.debug('[WS] disconnected'),
    onStompError: (frame) => console.error('[WS] STOMP error', frame),
  })

  return new Promise<void>((resolve, reject) => {
    const original = client!.onConnect
    client!.onConnect = (frame) => {
      original?.call(client, frame)
      resolve()
    }
    client!.onWebSocketError = (err) => reject(err)
    client!.activate()
  })
}

export function disconnectWebSocket(): void {
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
