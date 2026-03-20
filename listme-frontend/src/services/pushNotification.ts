import apiClient from './api'

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

  // Backend returns the key as a base64url string — browsers accept it directly
  const { data: publicKey } = await apiClient.get<string>('/notifications/vapid-public-key')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  })

  await syncWithBackend(subscription)
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!navigator.serviceWorker) return
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
