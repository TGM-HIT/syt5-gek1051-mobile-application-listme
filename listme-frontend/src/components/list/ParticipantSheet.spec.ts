import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantSheet from './ParticipantSheet.vue'
import type { ParticipantResponse, Item } from '../../types'

const PARTICIPANT: ParticipantResponse = {
  deviceId: 'device-abc-123',
  displayName: 'Alice Müller',
  role: 'owner',
  profilePicture: null,
  joinedAt: '2026-01-01T00:00:00Z',
}

const BASE_ITEM = { listId: 'list-1', categoryId: null, categoryName: null, categoryColor: null, labels: [], createdAt: '', updatedAt: '', imageUrl: null }
const ITEMS: Item[] = [
  { id: 'i1', name: 'Milk',   checked: false, createdByDeviceId: 'device-abc-123', deletedAt: null, quantity: 2,    quantityUnit: 'L',  price: null, position: 0, ...BASE_ITEM },
  { id: 'i2', name: 'Bread',  checked: true,  createdByDeviceId: 'device-abc-123', deletedAt: null, quantity: null, quantityUnit: null, price: null, position: 1, ...BASE_ITEM },
  { id: 'i3', name: 'Cheese', checked: false, createdByDeviceId: 'other-device',   deletedAt: null, quantity: null, quantityUnit: null, price: null, position: 2, ...BASE_ITEM },
]

function mountSheet(participant: ParticipantResponse | null = PARTICIPANT, items = ITEMS) {
  return mount(ParticipantSheet, {
    props: { participant, items },
    global: {
      stubs: { Teleport: true, Transition: { template: '<slot />' } },
    },
  })
}

describe('ParticipantSheet', () => {
  it('hidden when participant is null', () => {
    const w = mountSheet(null)
    expect(w.find('.rounded-t-3xl').exists()).toBe(false)
  })

  it('shows display name', () => {
    const w = mountSheet()
    expect(w.text()).toContain('Alice Müller')
  })

  it('shows initials from full name (AM)', () => {
    const w = mountSheet()
    expect(w.text()).toContain('AM')
  })

  it('shows first two chars when single-word name', () => {
    const p = { ...PARTICIPANT, displayName: 'Bob' }
    const w = mountSheet(p)
    expect(w.text()).toContain('BO')
  })

  it('falls back to first char of deviceId when no displayName', () => {
    const p = { ...PARTICIPANT, displayName: null }
    const w = mountSheet(p as unknown as ParticipantResponse)
    expect(w.text()).toContain('D') // 'device-abc-123'.charAt(0).toUpperCase()
  })

  it('shows owner role label', () => {
    const w = mountSheet()
    expect(w.text()).toContain('Ersteller')
  })

  it('shows participant role label for non-owner', () => {
    const p = { ...PARTICIPANT, role: 'member' as const }
    const w = mountSheet(p as unknown as ParticipantResponse)
    expect(w.text()).toContain('Teilnehmer')
  })

  it('shows deviceId prefix', () => {
    const w = mountSheet()
    expect(w.text()).toContain('device-a') // first 8 chars
  })

  it('shows only items from this participant (not deleted)', () => {
    const w = mountSheet()
    const itemNames = w.findAll('.text-sm.text-ctp-text').map(el => el.text())
    expect(itemNames).toContain('Milk')
    expect(itemNames).toContain('Bread')
    expect(itemNames).not.toContain('Cheese')
  })

  it('shows quantity and unit for items that have them', () => {
    const w = mountSheet()
    expect(w.text()).toContain('2 L')
  })

  it('shows empty state when participant has no items', () => {
    const w = mountSheet(PARTICIPANT, [])
    expect(w.text()).toContain('Noch keine Artikel hinzugefügt')
  })

  it('close button emits close event', async () => {
    const w = mountSheet()
    await w.find('.absolute.inset-0').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('item count shows in header', () => {
    const w = mountSheet()
    expect(w.text()).toContain('(2)') // Milk + Bread from device-abc-123
  })
})
