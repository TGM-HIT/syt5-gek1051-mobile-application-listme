// BLE UUIDs must match BleConstants.kt exactly
const SERVICE_UUID = '0000fe9a-0000-1000-8000-00805f9b34fb'
const SYNC_TOKEN_CHAR_UUID = '0000fe9b-0000-1000-8000-00805f9b34fb'
const DEVICE_ID_CHAR_UUID = '0000fe9c-0000-1000-8000-00805f9b34fb'

export type BluetoothSupportStatus = 'supported' | 'not-chrome' | 'not-secure' | 'no-bluetooth'

export function getBluetoothSupportStatus(): BluetoothSupportStatus {
  if (typeof navigator === 'undefined') return 'no-bluetooth'
  // Must be a secure context (HTTPS or localhost) — HTTP over LAN won't have navigator.bluetooth
  if (!window.isSecureContext) return 'not-secure'
  if (!('bluetooth' in navigator)) return 'not-chrome'
  return 'supported'
}

export function isWebBluetoothSupported(): boolean {
  return getBluetoothSupportStatus() === 'supported'
}

export interface WatchPairResult {
  watchDeviceId: string
}

/**
 * Connects to the ListMe Wear OS app via Web Bluetooth and writes the sync token.
 *
 * Requires:
 *   - Chrome on Android (or Chrome desktop with BT adapter)
 *   - HTTPS (or localhost)
 *   - ListMe watch app running in foreground with BLE advertising active
 *
 * Flow:
 *   1. Chrome shows a native BT device picker (filters by ListMe service UUID)
 *   2. User selects their Pixel Watch 3
 *   3. We write the syncToken to the SYNC_TOKEN characteristic
 *   4. Watch saves it and fetches all lists via WiFi/LTE
 */
/**
 * Derives the backend base URL to send to the watch.
 * In production the PWA and backend share the same origin.
 * In dev, set VITE_WATCH_API_URL in .env.local to override (e.g. http://192.168.1.x:8080).
 */
function getBackendUrl(): string {
  const override = import.meta.env.VITE_WATCH_API_URL as string | undefined
  if (override) return override.replace(/\/$/, '')
  return window.location.origin
}

export async function pairWatch(syncToken: string): Promise<WatchPairResult> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth wird von diesem Browser nicht unterstützt. Bitte Chrome verwenden.')
  }

  // @ts-ignore – navigator.bluetooth is not in all TS lib versions
  const device: BluetoothDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
    optionalServices: [SERVICE_UUID],
  })

  const server = await device.gatt!.connect()
  const service = await server.getPrimaryService(SERVICE_UUID)

  // Write JSON payload: token + server URL so the watch knows where to fetch
  const tokenChar = await service.getCharacteristic(SYNC_TOKEN_CHAR_UUID)
  const payload = JSON.stringify({ token: syncToken, serverUrl: getBackendUrl() })
  const encoded = new TextEncoder().encode(payload)
  await tokenChar.writeValueWithResponse(encoded)

  // Read back watch's deviceId as confirmation
  let watchDeviceId = 'unbekannt'
  try {
    const idChar = await service.getCharacteristic(DEVICE_ID_CHAR_UUID)
    const value = await idChar.readValue()
    watchDeviceId = new TextDecoder().decode(value)
  } catch {
    // optional — doesn't affect the sync
  }

  device.gatt!.disconnect()
  return { watchDeviceId }
}
