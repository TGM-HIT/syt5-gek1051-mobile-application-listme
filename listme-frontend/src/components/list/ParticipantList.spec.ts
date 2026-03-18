import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ParticipantResponse } from '../../types'

const { mockGetParticipants } = vi.hoisted(() => ({ mockGetParticipants: vi.fn() }))

vi.mock('../../services/share', () => ({
  shareService: { getParticipants: mockGetParticipants },
}))

import ParticipantList from './ParticipantList.vue'

const p1: ParticipantResponse = { deviceId: 'dev1', displayName: 'Alice Müller', role: 'owner', profilePicture: null, joinedAt: '' }
const p2: ParticipantResponse = { deviceId: 'dev2', displayName: null, role: 'member', profilePicture: null, joinedAt: '' }

describe('ParticipantList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders nothing when fewer than 2 participants', async () => {
    mockGetParticipants.mockResolvedValue([p1])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.find('button').exists()).toBe(false)
  })

  it('renders participant avatars when 2+ participants', async () => {
    mockGetParticipants.mockResolvedValue([p1, p2])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.findAll('button').length).toBe(2)
  })

  it('shows participant count label', async () => {
    mockGetParticipants.mockResolvedValue([p1, p2])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.text()).toContain('2 Teilnehmer')
  })

  it('shows initials from displayName', async () => {
    mockGetParticipants.mockResolvedValue([p1, p2])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.text()).toContain('AM') // Alice Müller → AM
  })

  it('shows first char of deviceId when no displayName', async () => {
    mockGetParticipants.mockResolvedValue([p1, p2])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.text()).toContain('D') // dev2 → D
  })

  it('emits click-participant when avatar is clicked', async () => {
    mockGetParticipants.mockResolvedValue([p1, p2])
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('click-participant')).toBeDefined()
    expect(w.emitted('click-participant')![0]).toEqual([p1])
  })

  it('shows overflow badge when more than 5 participants', async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      ...p1, deviceId: `dev${i}`, displayName: `User ${i}`,
    }))
    mockGetParticipants.mockResolvedValue(many)
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.text()).toContain('+2')
  })

  it('handles getParticipants failure gracefully', async () => {
    mockGetParticipants.mockRejectedValue(new Error('network error'))
    const w = mount(ParticipantList, { props: { listId: 'l1' } })
    await flushPromises()
    expect(w.find('button').exists()).toBe(false) // no participants loaded, no render
  })
})
