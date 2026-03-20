import apiClient from './api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  // Array.from ensures Uint8Array<ArrayBuffer>, not Uint8Array<ArrayBufferLike>
  return new Uint8Array(Array.from(raw).map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready

  // Re-use existing subscription if present
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await syncWithBackend(existing)
    return
  }

  const { data: publicKey } = await apiClient.get<string>('/notifications/vapid-public-key')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  await syncWithBackend(subscription)
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await apiClient.delete('/notifications/subscribe', {
    data: { endpoint: subscription.endpoint, p256dh: '', auth: '' },
  })
  await subscription.unsubscribe()
}

async function syncWithBackend(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON()
  await apiClient.post('/notifications/subscribe', {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  })
}
