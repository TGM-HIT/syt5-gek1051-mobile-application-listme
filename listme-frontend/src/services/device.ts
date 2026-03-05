import Dexie from 'dexie'
import api from './api'

export interface DeviceInfo {
  id: string
  displayName: string | null
  createdAt: string
}

export const deviceService = {
  get: (deviceId: string): Promise<DeviceInfo> =>
    api.get<DeviceInfo>(`/devices/${deviceId}`).then(r => r.data),
}

class DeviceDb extends Dexie {
  meta!: Dexie.Table<{ key: string; value: string }, string>

  constructor() {
    super('listme-device')
    this.version(1).stores({ meta: 'key' })
  }
}

const db = new DeviceDb()

function generateUUID(): string {
  return crypto.randomUUID()
}

let cachedDeviceId: string | null = null

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId

  const row = await db.meta.get('deviceId')
  if (row) {
    cachedDeviceId = row.value
    return cachedDeviceId
  }

  const newId = generateUUID()
  await db.meta.put({ key: 'deviceId', value: newId })
  cachedDeviceId = newId
  return newId
}
