import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CrdtOperation } from '../crdt/types'

// ── mocks ──────────────────────────────────────────────────────────────────
const { mockConnect, mockSubscribe, mockSend, mockIsConnected, mockGetDeviceId, mockDetect, mockOnAnyConnect } =
  vi.hoisted(() => ({
    mockConnect: vi.fn(),
    mockSubscribe: vi.fn(),
    mockSend: vi.fn(),
    mockIsConnected: vi.fn(),
    mockGetDeviceId: vi.fn(),
    mockDetect: vi.fn(),
    mockOnAnyConnect: vi.fn(),
  }))

const mockItemsByList: Record<string, ReturnType<typeof vi.fn>> = {}
const mockFetchAll = vi.fn()
const mockPatchCounts = vi.fn()

const mockSetSnapshot = vi.fn()
const mockAddDevice = vi.fn()
const mockRemoveDevice = vi.fn()

vi.mock('../services/websocket', () => ({
  connectWebSocket: mockConnect,
  subscribe: mockSubscribe,
  send: mockSend,
  isConnected: mockIsConnected,
  onAnyConnect: mockOnAnyConnect,
}))

vi.mock('../services/device', () => ({ getDeviceId: mockGetDeviceId }))
vi.mock('../crdt/ConflictDetector', () => ({ detectConflicts: mockDetect }))
vi.mock('../services/clock', () => ({ LocalClockService: { mergeClock: vi.fn() } }))
vi.mock('../crdt/OperationQueue', () => ({ OperationQueue: { getAllPending: vi.fn().mockResolvedValue([]) } }))
vi.mock('../stores/notifications', () => ({ useNotificationsStore: () => ({ add: vi.fn() }) }))
vi.mock('../stores/lists', () => ({ useListsStore: () => ({ getById: vi.fn().mockReturnValue({ name: 'Test' }) }) }))

vi.mock('../stores/items', () => ({
  useItemsStore: () => ({
    getItems: (listId: string) => mockItemsByList[listId] ?? [],
    fetchAll: mockFetchAll,
    patchCounts: mockPatchCounts,
    itemsByList: {},
  }),
}))

vi.mock('../stores/presence', () => ({
  usePresenceStore: () => ({
    setSnapshot: mockSetSnapshot,
    addDevice: mockAddDevice,
    removeDevice: mockRemoveDevice,
  }),
}))

import { useListSync } from './useListSync'

function makeOp(overrides: Partial<CrdtOperation> = {}): CrdtOperation {
  return {
    id: 'op1',
    listId: 'l1',
    deviceId: 'other-device',
    operationType: 'ITEM_CREATE',
    payload: { itemId: 'i1', name: 'Äpfel', position: 0 },
    vectorClock: { 'other-device': 1 },
    createdAt: Date.now(),
    synced: false,
    ...overrides,
  }
}

describe('useListSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockConnect.mockResolvedValue(undefined)
    mockIsConnected.mockReturnValue(true)
    mockGetDeviceId.mockResolvedValue('my-device')
    mockSubscribe.mockReturnValue(() => {})
    mockFetchAll.mockResolvedValue(undefined)
    mockOnAnyConnect.mockImplementation((cb: () => void) => { cb(); return () => {} })
    mockDetect.mockReturnValue([])
  })

  it('exposes connected, conflicts, startSync, stopSync, dismissConflicts', () => {
    const sync = useListSync()
    expect(sync).toHaveProperty('connected')
    expect(sync).toHaveProperty('conflicts')
    expect(sync).toHaveProperty('startSync')
    expect(sync).toHaveProperty('stopSync')
    expect(sync).toHaveProperty('dismissConflicts')
  })

  it('connected is false initially', () => {
    const { connected } = useListSync()
    expect(connected.value).toBe(false)
  })

  it('connected is true after startSync succeeds', async () => {
    mockIsConnected.mockReturnValue(true)
    const { connected, startSync } = useListSync()
    await startSync('l1')
    expect(connected.value).toBe(true)
  })

  it('connected stays false if connectWebSocket throws', async () => {
    mockConnect.mockRejectedValue(new Error('WS unavailable'))
    mockOnAnyConnect.mockReturnValue(() => {}) // WS never connects, callback never fires
    const { connected, startSync } = useListSync()
    await startSync('l1')
    expect(connected.value).toBe(false)
  })

  it('startSync subscribes to crdt ops topic', async () => {
    const { startSync } = useListSync()
    await startSync('l1')
    expect(mockSubscribe).toHaveBeenCalledWith('/topic/list/l1', expect.any(Function))
  })

  it('fetchAll runs before subscribing to topics (prevents double-notification race)', async () => {
    const callOrder: string[] = []
    mockFetchAll.mockImplementation(() => { callOrder.push('fetchAll'); return Promise.resolve() })
    mockSubscribe.mockImplementation(() => { callOrder.push('subscribe'); return () => {} })
    const { startSync } = useListSync()
    await startSync('l1')
    const fetchIdx = callOrder.indexOf('fetchAll')
    const subscribeIdx = callOrder.indexOf('subscribe')
    expect(fetchIdx).toBeGreaterThanOrEqual(0)
    expect(subscribeIdx).toBeGreaterThan(fetchIdx)
  })

  it('startSync subscribes to presence topic', async () => {
    const { startSync } = useListSync()
    await startSync('l1')
    expect(mockSubscribe).toHaveBeenCalledWith('/topic/list/l1/presence', expect.any(Function))
  })

  it('startSync sends join message', async () => {
    const { startSync } = useListSync()
    await startSync('l1')
    expect(mockSend).toHaveBeenCalledWith('/app/list/l1/join')
  })

  it('stopSync sends leave message', async () => {
    const { startSync, stopSync } = useListSync()
    await startSync('l1')
    stopSync()
    expect(mockSend).toHaveBeenCalledWith('/app/list/l1/leave')
  })

  it('dismissConflicts clears conflicts array', async () => {
    mockDetect.mockReturnValue([{ a: makeOp(), b: makeOp({ id: 'op2' }) }])
    const { startSync, conflicts, dismissConflicts } = useListSync()
    await startSync('l1')

    // Simulate incoming op from another device
    const [[, opsCb]] = mockSubscribe.mock.calls as [[string, (payload: unknown) => void]]
    opsCb(makeOp())

    dismissConflicts()
    expect(conflicts.value).toHaveLength(0)
  })

  it('incoming op from own device is ignored', async () => {
    mockGetDeviceId.mockResolvedValue('my-device')
    const { startSync } = useListSync()
    await startSync('l1')

    const [[, opsCb]] = mockSubscribe.mock.calls as [[string, (payload: unknown) => void]]
    opsCb(makeOp({ deviceId: 'my-device' }))

    // detectConflicts should not be called because op was skipped
    expect(mockDetect).not.toHaveBeenCalled()
  })

  it('presence snapshot event calls setSnapshot', async () => {
    const { startSync } = useListSync()
    await startSync('l1')

    const [, [, presenceCb]] = mockSubscribe.mock.calls as [[string, (p: unknown) => void], [string, (p: unknown) => void]]
    presenceCb({ event: 'snapshot', deviceId: '', onlineDevices: ['dev1', 'dev2'] })
    expect(mockSetSnapshot).toHaveBeenCalledWith('l1', ['dev1', 'dev2'])
  })

  it('presence joined event calls addDevice', async () => {
    const { startSync } = useListSync()
    await startSync('l1')

    const [, [, presenceCb]] = mockSubscribe.mock.calls as [[string, (p: unknown) => void], [string, (p: unknown) => void]]
    presenceCb({ event: 'joined', deviceId: 'dev3', onlineDevices: [] })
    expect(mockAddDevice).toHaveBeenCalledWith('l1', 'dev3')
  })

  it('presence left event calls removeDevice', async () => {
    const { startSync } = useListSync()
    await startSync('l1')

    const [, [, presenceCb]] = mockSubscribe.mock.calls as [[string, (p: unknown) => void], [string, (p: unknown) => void]]
    presenceCb({ event: 'left', deviceId: 'dev3', onlineDevices: [] })
    expect(mockRemoveDevice).toHaveBeenCalledWith('l1', 'dev3')
  })
})
