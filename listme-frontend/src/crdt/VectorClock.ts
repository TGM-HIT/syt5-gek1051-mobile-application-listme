import type { VectorClockMap, ClockRelation } from './types'

/**
 * Immutable vector clock — mirrors the Java VectorClock exactly.
 * Keyed by deviceId (string UUID).
 */
export class VectorClock {
  private readonly clock: VectorClockMap

  constructor(clock: VectorClockMap = {}) {
    this.clock = { ...clock }
  }

  static of(map: VectorClockMap): VectorClock {
    return new VectorClock(map)
  }

  /** Increment this device's counter, returning a new VectorClock. */
  increment(deviceId: string): VectorClock {
    return new VectorClock({
      ...this.clock,
      [deviceId]: (this.clock[deviceId] ?? 0) + 1,
    })
  }

  /** Merge two clocks by taking the maximum counter per device. */
  merge(other: VectorClock): VectorClock {
    const allDevices = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(other.clock),
    ])
    const merged: VectorClockMap = {}
    for (const device of allDevices) {
      merged[device] = Math.max(this.get(device), other.get(device))
    }
    return new VectorClock(merged)
  }

  /** Compare this clock against other — returns causal relationship. */
  compare(other: VectorClock): ClockRelation {
    const allDevices = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(other.clock),
    ])

    let thisHasGreater = false
    let otherHasGreater = false

    for (const device of allDevices) {
      const a = this.get(device)
      const b = other.get(device)
      if (a > b) thisHasGreater = true
      if (b > a) otherHasGreater = true
    }

    if (!thisHasGreater && !otherHasGreater) return 'EQUAL'
    if (thisHasGreater && !otherHasGreater) return 'AFTER'
    if (!thisHasGreater) return 'BEFORE'
    return 'CONCURRENT'
  }

  get(deviceId: string): number {
    return this.clock[deviceId] ?? 0
  }

  toMap(): VectorClockMap {
    return { ...this.clock }
  }
}
