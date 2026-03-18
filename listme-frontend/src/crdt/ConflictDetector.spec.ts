import { describe, it, expect } from 'vitest'
import { detectConflicts, resolveLww } from './ConflictDetector'
import type { CrdtOperation } from './types'

function makeOp(
  id: string,
  itemId: string,
  clock: Record<string, number>,
  ts = 1000,
): CrdtOperation {
  return {
    id,
    listId: 'list-1',
    deviceId: 'dev-A',
    operationType: 'ITEM_UPDATE',
    payload: { itemId, timestamp: ts },
    vectorClock: clock,
    createdAt: ts,
  }
}

describe('detectConflicts', () => {
  // ── edge cases ────────────────────────────────────────────────────────────

  it('returns empty array for empty input', () => {
    expect(detectConflicts([])).toEqual([])
  })

  it('returns empty array for single op', () => {
    expect(detectConflicts([makeOp('op1', 'item-1', { 'dev-A': 1 })])).toEqual([])
  })

  // ── causal (no conflict) ──────────────────────────────────────────────────

  it('causal ops on same item are not conflicts', () => {
    const op1 = makeOp('op1', 'item-1', { 'dev-A': 1, 'dev-B': 0 })
    const op2 = makeOp('op2', 'item-1', { 'dev-A': 1, 'dev-B': 1 })
    expect(detectConflicts([op1, op2])).toEqual([])
  })

  it('AFTER relation on same item is not a conflict', () => {
    const older = makeOp('old', 'item-1', { A: 1 })
    const newer = makeOp('new', 'item-1', { A: 3 })
    expect(detectConflicts([older, newer])).toEqual([])
  })

  it('equal clocks on same item are not conflicts', () => {
    const a = makeOp('a', 'item-1', { 'dev-A': 2 })
    const b = makeOp('b', 'item-1', { 'dev-A': 2 })
    expect(detectConflicts([a, b])).toEqual([])
  })

  // ── concurrent (conflict) ─────────────────────────────────────────────────

  it('concurrent ops on same item are a conflict', () => {
    const opA = makeOp('op-a', 'item-1', { 'dev-A': 2, 'dev-B': 1 })
    const opB = makeOp('op-b', 'item-1', { 'dev-A': 1, 'dev-B': 2 })
    const conflicts = detectConflicts([opA, opB])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]!.a).toBe(opA)
    expect(conflicts[0]!.b).toBe(opB)
  })

  // ── different targets ─────────────────────────────────────────────────────

  it('concurrent ops on different items are not conflicts', () => {
    const opA = makeOp('op-a', 'item-1', { 'dev-A': 2, 'dev-B': 1 })
    const opB = makeOp('op-b', 'item-2', { 'dev-A': 1, 'dev-B': 2 })
    expect(detectConflicts([opA, opB])).toEqual([])
  })

  // ── multiple conflicts ────────────────────────────────────────────────────

  it('detects multiple conflict pairs across different items', () => {
    const a1 = makeOp('a1', 'item-1', { 'dev-A': 2, 'dev-B': 1 })
    const b1 = makeOp('b1', 'item-1', { 'dev-A': 1, 'dev-B': 2 })
    const a2 = makeOp('a2', 'item-2', { 'dev-A': 3, 'dev-B': 1 })
    const b2 = makeOp('b2', 'item-2', { 'dev-A': 1, 'dev-B': 3 })
    expect(detectConflicts([a1, b1, a2, b2])).toHaveLength(2)
  })

  it('three-way concurrent ops yield three conflict pairs', () => {
    const opA = makeOp('a', 'item-1', { 'dev-A': 1, 'dev-B': 0, 'dev-C': 0 })
    const opB = makeOp('b', 'item-1', { 'dev-A': 0, 'dev-B': 1, 'dev-C': 0 })
    const opC = makeOp('c', 'item-1', { 'dev-A': 0, 'dev-B': 0, 'dev-C': 1 })
    expect(detectConflicts([opA, opB, opC])).toHaveLength(3)
  })
})

describe('resolveLww', () => {
  it('returns the op with the higher timestamp', () => {
    const older = makeOp('old', 'item-1', {}, 1000)
    const newer = makeOp('new', 'item-1', {}, 2000)
    expect(resolveLww(older, newer)).toBe(newer)
    expect(resolveLww(newer, older)).toBe(newer)
  })

  it('tiebreaks by id when timestamps are equal', () => {
    const opA = makeOp('aaa', 'item-1', {}, 1000)
    const opB = makeOp('bbb', 'item-1', {}, 1000)
    // 'bbb' > 'aaa' lexicographically
    expect(resolveLww(opA, opB)).toBe(opB)
    expect(resolveLww(opB, opA)).toBe(opB)
  })

  it('tiebreak is deterministic regardless of argument order', () => {
    const opA = makeOp('zzz', 'item-1', {}, 500)
    const opB = makeOp('aaa', 'item-1', {}, 500)
    expect(resolveLww(opA, opB)).toBe(opA)
    expect(resolveLww(opB, opA)).toBe(opA)
  })
})
