import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { get: mockGet, post: mockPost, delete: mockDelete },
}))

import { shareService } from './share'

const list = { id: 'l1', name: 'Test', emoji: '🛒', shareToken: 'tok', itemCount: 0, checkedCount: 0, participantCount: 1, createdAt: '', updatedAt: '' }
const tokenResp = { token: 'abc123', shareUrl: 'http://x/s/abc123' }

describe('shareService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generateToken calls POST /lists/:id/share', async () => {
    mockPost.mockResolvedValue({ data: tokenResp })
    const result = await shareService.generateToken('l1')
    expect(mockPost).toHaveBeenCalledWith('/lists/l1/share')
    expect(result).toEqual(tokenResp)
  })

  it('revokeToken calls DELETE /lists/:id/share', async () => {
    mockDelete.mockResolvedValue({})
    const result = await shareService.revokeToken('l1')
    expect(mockDelete).toHaveBeenCalledWith('/lists/l1/share')
    expect(result).toBeUndefined()
  })

  it('previewToken calls GET /share/:token', async () => {
    mockGet.mockResolvedValue({ data: list })
    const result = await shareService.previewToken('abc123')
    expect(mockGet).toHaveBeenCalledWith('/share/abc123')
    expect(result).toEqual(list)
  })

  it('joinViaToken calls POST /share/:token/join', async () => {
    mockPost.mockResolvedValue({ data: list })
    const result = await shareService.joinViaToken('abc123')
    expect(mockPost).toHaveBeenCalledWith('/share/abc123/join')
    expect(result).toEqual(list)
  })

  it('createSyncToken calls POST /sync', async () => {
    const syncResp = { token: 'sync123', syncUrl: 'http://x/sync/sync123' }
    mockPost.mockResolvedValue({ data: syncResp })
    const result = await shareService.createSyncToken()
    expect(mockPost).toHaveBeenCalledWith('/sync')
    expect(result).toEqual(syncResp)
  })

  it('previewSyncToken calls GET /sync/:token', async () => {
    mockGet.mockResolvedValue({ data: [list] })
    const result = await shareService.previewSyncToken('sync123')
    expect(mockGet).toHaveBeenCalledWith('/sync/sync123')
    expect(result).toEqual([list])
  })

  it('applySyncToken calls POST /sync/:token/apply', async () => {
    mockPost.mockResolvedValue({ data: [list] })
    const result = await shareService.applySyncToken('sync123')
    expect(mockPost).toHaveBeenCalledWith('/sync/sync123/apply')
    expect(result).toEqual([list])
  })

  it('getParticipants calls GET /lists/:id/participants', async () => {
    const participants = [{ deviceId: 'dev1', displayName: null, joinedAt: '' }]
    mockGet.mockResolvedValue({ data: participants })
    const result = await shareService.getParticipants('l1')
    expect(mockGet).toHaveBeenCalledWith('/lists/l1/participants')
    expect(result).toEqual(participants)
  })
})
