import api from './api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function getVapidPublicKey(): Promise<string> {
  const { data } = await api.get<{ publicKey: string }>('/push/public-key')
  return data.publicKey
}

async function subscribeToPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    // Re-send to backend in case it was lost (e.g. new device install)
    await sendSubscriptionToServer(existing)
    return
  }

  const vapidKey = await getVapidPublicKey()
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })
  await sendSubscriptionToServer(sub)
}

async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON()
  await api.post('/push/subscribe', {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
  })
}

export const pushService = {
  /** Call once on app init. Requests permission, subscribes, registers with backend. */
  async init(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return // push not supported in this browser
    }

    let permission = Notification.permission
    if (permission === 'denied') return

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') return

    try {
      await subscribeToPush()
    } catch (e) {
      console.warn('[Push] Failed to subscribe:', e)
    }
  },

  async unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } })
    await sub.unsubscribe()
  },
}
