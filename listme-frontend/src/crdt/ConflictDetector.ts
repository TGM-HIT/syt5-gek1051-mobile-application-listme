import { VectorClock } from './VectorClock'
import type { CrdtOperation } from './types'

export interface Conflict {
  a: CrdtOperation
  b: CrdtOperation
}

/**
 * Client-side conflict detector — mirrors backend ConflictDetector logic.
 *
 * Two operations on the same item are concurrent if neither vector clock
 * causally dominates the other.
 */
export function detectConflicts(ops: CrdtOperation[]): Conflict[] {
  const conflicts: Conflict[] = []

  for (let i = 0; i < ops.length; i++) {
    for (let j = i + 1; j < ops.length; j++) {
      const a = ops[i]!
      const b = ops[j]!

      const targetA = a.payload['itemId']
      const targetB = b.payload['itemId']
      if (!targetA || targetA !== targetB) continue

      const clockA = VectorClock.of(a.vectorClock)
      const clockB = VectorClock.of(b.vectorClock)

      if (clockA.compare(clockB) === 'CONCURRENT') {
        conflicts.push({ a, b })
      }
    }
  }

  return conflicts
}

/**
 * LWW (Last-Write-Wins) resolution for two concurrent operations.
 * Falls back to lexicographic deviceId comparison for equal timestamps.
 */
export function resolveLww(a: CrdtOperation, b: CrdtOperation): CrdtOperation {
  const tsA = (a.payload['timestamp'] as number) ?? a.createdAt
  const tsB = (b.payload['timestamp'] as number) ?? b.createdAt

  if (tsA > tsB) return a
  if (tsB > tsA) return b
  // Tiebreak: higher deviceId wins (deterministic across all devices)
  return a.id > b.id ? a : b
}
