import Dexie from 'dexie'

const KEY = 'listme:userId'

export function getUserId(): string | null {
  return localStorage.getItem(KEY)
}

export function setUserId(id: string): void {
  localStorage.setItem(KEY, id)
}

export function getOrCreateUserId(): string {
  const existing = getUserId()
  if (existing) return existing
  const newId = crypto.randomUUID()
  setUserId(newId)
  return newId
}

// Called once before the app mounts.
// Migrates an existing deviceId from IndexedDB (old format) → localStorage userId.
class LegacyDeviceDb extends Dexie {
  meta!: Dexie.Table<{ key: string; value: string }, string>
  constructor() {
    super('listme-device')
    this.version(1).stores({ meta: 'key' })
  }
}

export async function initUserId(): Promise<void> {
  if (getUserId()) return // already set

  try {
    const db = new LegacyDeviceDb()
    const row = await db.meta.get('deviceId')
    if (row?.value) {
      setUserId(row.value)
      return
    }
  } catch {
    // IndexedDB unavailable (SSR, test env, etc.) — skip migration
  }

  setUserId(crypto.randomUUID())
}
