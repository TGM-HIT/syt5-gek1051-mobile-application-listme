import { describe, it, expect } from 'vitest'
import { VectorClock } from './VectorClock'

describe('VectorClock', () => {
  // ── get / empty ──────────────────────────────────────────────────────────

  it('returns 0 for unknown device on empty clock', () => {
    expect(new VectorClock().get('any')).toBe(0)
  })

  // ── increment ────────────────────────────────────────────────────────────

  it('increment creates a new clock without mutating the original', () => {
    const original = new VectorClock()
    const incremented = original.increment('dev-A')
    expect(incremented.get('dev-A')).toBe(1)
    expect(original.get('dev-A')).toBe(0)
  })

  it('increments the same device multiple times', () => {
    let vc = new VectorClock()
    vc = vc.increment('dev-A').increment('dev-A').increment('dev-A')
    expect(vc.get('dev-A')).toBe(3)
  })

  it('tracks multiple devices independently', () => {
    const vc = new VectorClock()
      .increment('dev-A')
      .increment('dev-B')
      .increment('dev-A')
    expect(vc.get('dev-A')).toBe(2)
    expect(vc.get('dev-B')).toBe(1)
    expect(vc.get('dev-C')).toBe(0)
  })

  // ── merge ────────────────────────────────────────────────────────────────

  it('merge takes max per device', () => {
    const a = VectorClock.of({ 'dev-A': 5, 'dev-B': 2 })
    const b = VectorClock.of({ 'dev-A': 3, 'dev-B': 7, 'dev-C': 1 })
    const merged = a.merge(b)
    expect(merged.get('dev-A')).toBe(5)
    expect(merged.get('dev-B')).toBe(7)
    expect(merged.get('dev-C')).toBe(1)
  })

  it('merge with empty clock returns same values', () => {
    const vc = VectorClock.of({ A: 3 })
    expect(vc.merge(new VectorClock()).toMap()).toEqual(vc.toMap())
  })

  it('merge is commutative', () => {
    const a = VectorClock.of({ 'dev-A': 5, 'dev-B': 1 })
    const b = VectorClock.of({ 'dev-A': 2, 'dev-B': 8 })
    expect(a.merge(b).toMap()).toEqual(b.merge(a).toMap())
  })

  it('merge is associative', () => {
    const a = VectorClock.of({ x: 1 })
    const b = VectorClock.of({ x: 3 })
    const c = VectorClock.of({ x: 2 })
    expect(a.merge(b).merge(c).toMap()).toEqual(a.merge(b.merge(c)).toMap())
  })

  it('merge is idempotent', () => {
    const vc = VectorClock.of({ A: 3, B: 5 })
    expect(vc.merge(vc).toMap()).toEqual(vc.toMap())
  })

  // ── compare ──────────────────────────────────────────────────────────────

  it('compare: EQUAL', () => {
    expect(VectorClock.of({ X: 3 }).compare(VectorClock.of({ X: 3 }))).toBe('EQUAL')
  })

  it('compare: two empty clocks are EQUAL', () => {
    expect(new VectorClock().compare(new VectorClock())).toBe('EQUAL')
  })

  it('compare: BEFORE', () => {
    const older = VectorClock.of({ A: 1, B: 2 })
    const newer = VectorClock.of({ A: 3, B: 4 })
    expect(older.compare(newer)).toBe('BEFORE')
  })

  it('compare: AFTER', () => {
    expect(VectorClock.of({ A: 5 }).compare(VectorClock.of({ A: 1 }))).toBe('AFTER')
  })

  it('compare: BEFORE and AFTER are symmetric', () => {
    const older = VectorClock.of({ A: 1 })
    const newer = VectorClock.of({ A: 2 })
    expect(older.compare(newer)).toBe('BEFORE')
    expect(newer.compare(older)).toBe('AFTER')
  })

  it('compare: CONCURRENT', () => {
    const a = VectorClock.of({ 'dev-A': 2, 'dev-B': 1 })
    const b = VectorClock.of({ 'dev-A': 1, 'dev-B': 2 })
    expect(a.compare(b)).toBe('CONCURRENT')
    expect(b.compare(a)).toBe('CONCURRENT')
  })

  it('missing device counted as zero in compare', () => {
    const withoutB = VectorClock.of({ 'dev-A': 1 })
    const withB = VectorClock.of({ 'dev-A': 1, 'dev-B': 1 })
    expect(withoutB.compare(withB)).toBe('BEFORE')
    expect(withB.compare(withoutB)).toBe('AFTER')
  })

  // ── toMap ────────────────────────────────────────────────────────────────

  it('toMap returns a defensive copy', () => {
    const vc = VectorClock.of({ A: 1 })
    const map = vc.toMap()
    map['B'] = 99
    expect(vc.get('B')).toBe(0)
  })

  it('of with empty map returns empty clock', () => {
    expect(new VectorClock({}).get('any')).toBe(0)
  })
})
