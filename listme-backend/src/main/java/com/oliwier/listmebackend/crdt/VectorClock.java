package com.oliwier.listmebackend.crdt;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Immutable vector clock keyed by deviceId (String UUID).
 *
 * Tracks causal ordering of operations across devices:
 *   - BEFORE: this happened before other (all counters <=, at least one <)
 *   - AFTER:  this happened after other  (all counters >=, at least one >)
 *   - CONCURRENT: neither dominates → conflict, needs CRDT merge
 *   - EQUAL: identical clocks
 */
public final class VectorClock {

    private final Map<String, Long> clock;

    public VectorClock() {
        this.clock = Collections.emptyMap();
    }

    private VectorClock(Map<String, Long> clock) {
        this.clock = Collections.unmodifiableMap(new HashMap<>(clock));
    }

    public static VectorClock of(Map<String, Long> map) {
        if (map == null || map.isEmpty()) return new VectorClock();
        return new VectorClock(map);
    }

    /** Increment this device's counter, returning a new VectorClock. */
    public VectorClock increment(String deviceId) {
        Map<String, Long> next = new HashMap<>(clock);
        next.merge(deviceId, 1L, (a, b) -> a + b);
        return new VectorClock(next);
    }

    /** Merge two clocks by taking the maximum counter per device. */
    public VectorClock merge(VectorClock other) {
        Set<String> allDevices = Stream.concat(
                clock.keySet().stream(),
                other.clock.keySet().stream()
        ).collect(Collectors.toSet());

        Map<String, Long> merged = new HashMap<>();
        for (String device : allDevices) {
            long a = clock.getOrDefault(device, 0L);
            long b = other.clock.getOrDefault(device, 0L);
            merged.put(device, Math.max(a, b));
        }
        return new VectorClock(merged);
    }

    public enum Relation { BEFORE, AFTER, CONCURRENT, EQUAL }

    /**
     * Compare this clock against other.
     * Returns the causal relationship of this relative to other.
     */
    public Relation compare(VectorClock other) {
        Set<String> allDevices = Stream.concat(
                clock.keySet().stream(),
                other.clock.keySet().stream()
        ).collect(Collectors.toSet());

        boolean thisHasGreater = false;
        boolean otherHasGreater = false;

        for (String device : allDevices) {
            long a = clock.getOrDefault(device, 0L);
            long b = other.clock.getOrDefault(device, 0L);
            if (a > b) thisHasGreater = true;
            if (b > a) otherHasGreater = true;
        }

        if (!thisHasGreater && !otherHasGreater) return Relation.EQUAL;
        if (thisHasGreater && !otherHasGreater) return Relation.AFTER;
        if (!thisHasGreater) return Relation.BEFORE;
        return Relation.CONCURRENT;
    }

    public long get(String deviceId) {
        return clock.getOrDefault(deviceId, 0L);
    }

    /** Returns a mutable copy suitable for DB storage (JSONB map). */
    public Map<String, Long> toMap() {
        return new HashMap<>(clock);
    }

    @Override
    public String toString() {
        return clock.toString();
    }
}
