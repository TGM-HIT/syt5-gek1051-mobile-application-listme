package com.oliwier.listmebackend.crdt;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class VectorClockTest {

    // ── get / empty ────────────────────────────────────────────────────────

    @Test
    void emptyClockReturnsZeroForUnknownDevice() {
        assertThat(new VectorClock().get("any")).isEqualTo(0L);
    }

    // ── increment ──────────────────────────────────────────────────────────

    @Test
    void incrementCreatesNewClockImmutably() {
        VectorClock original = new VectorClock();
        VectorClock incremented = original.increment("dev-A");
        assertThat(incremented.get("dev-A")).isEqualTo(1L);
        assertThat(original.get("dev-A")).isEqualTo(0L);
    }

    @Test
    void incrementAccumulatesOnSameDevice() {
        VectorClock vc = new VectorClock()
                .increment("dev-A")
                .increment("dev-A")
                .increment("dev-A");
        assertThat(vc.get("dev-A")).isEqualTo(3L);
    }

    @Test
    void incrementTracksMultipleDevicesIndependently() {
        VectorClock vc = new VectorClock()
                .increment("dev-A")
                .increment("dev-B")
                .increment("dev-A");
        assertThat(vc.get("dev-A")).isEqualTo(2L);
        assertThat(vc.get("dev-B")).isEqualTo(1L);
        assertThat(vc.get("dev-C")).isEqualTo(0L);
    }

    // ── merge ──────────────────────────────────────────────────────────────

    @Test
    void mergeTakesMaxPerDevice() {
        VectorClock a = VectorClock.of(Map.of("dev-A", 5L, "dev-B", 2L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 3L, "dev-B", 7L, "dev-C", 1L));
        VectorClock merged = a.merge(b);
        assertThat(merged.get("dev-A")).isEqualTo(5L);
        assertThat(merged.get("dev-B")).isEqualTo(7L);
        assertThat(merged.get("dev-C")).isEqualTo(1L);
    }

    @Test
    void mergeWithEmptyClockReturnsSelf() {
        VectorClock vc = VectorClock.of(Map.of("A", 3L));
        assertThat(vc.merge(new VectorClock()).toMap()).isEqualTo(vc.toMap());
    }

    @Test
    void mergeIsCommutative() {
        VectorClock a = VectorClock.of(Map.of("dev-A", 5L, "dev-B", 1L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 2L, "dev-B", 8L));
        assertThat(a.merge(b).toMap()).isEqualTo(b.merge(a).toMap());
    }

    @Test
    void mergeIsAssociative() {
        VectorClock a = VectorClock.of(Map.of("x", 1L));
        VectorClock b = VectorClock.of(Map.of("x", 3L));
        VectorClock c = VectorClock.of(Map.of("x", 2L));
        assertThat(a.merge(b).merge(c).toMap()).isEqualTo(a.merge(b.merge(c)).toMap());
    }

    @Test
    void mergeIsIdempotent() {
        VectorClock vc = VectorClock.of(Map.of("A", 3L, "B", 5L));
        assertThat(vc.merge(vc).toMap()).isEqualTo(vc.toMap());
    }

    // ── compare ────────────────────────────────────────────────────────────

    @Test
    void compareEqual() {
        VectorClock a = VectorClock.of(Map.of("X", 3L));
        VectorClock b = VectorClock.of(Map.of("X", 3L));
        assertThat(a.compare(b)).isEqualTo(VectorClock.Relation.EQUAL);
    }

    @Test
    void compareTwoEmptyClocksAreEqual() {
        assertThat(new VectorClock().compare(new VectorClock())).isEqualTo(VectorClock.Relation.EQUAL);
    }

    @Test
    void compareBefore() {
        VectorClock older = VectorClock.of(Map.of("A", 1L, "B", 2L));
        VectorClock newer = VectorClock.of(Map.of("A", 3L, "B", 4L));
        assertThat(older.compare(newer)).isEqualTo(VectorClock.Relation.BEFORE);
    }

    @Test
    void compareAfter() {
        VectorClock older = VectorClock.of(Map.of("A", 1L));
        VectorClock newer = VectorClock.of(Map.of("A", 5L));
        assertThat(newer.compare(older)).isEqualTo(VectorClock.Relation.AFTER);
    }

    @Test
    void compareBeforeAndAfterAreSymmetric() {
        VectorClock older = VectorClock.of(Map.of("A", 1L));
        VectorClock newer = VectorClock.of(Map.of("A", 2L));
        assertThat(older.compare(newer)).isEqualTo(VectorClock.Relation.BEFORE);
        assertThat(newer.compare(older)).isEqualTo(VectorClock.Relation.AFTER);
    }

    @Test
    void compareConcurrent() {
        VectorClock a = VectorClock.of(Map.of("dev-A", 2L, "dev-B", 1L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 1L, "dev-B", 2L));
        assertThat(a.compare(b)).isEqualTo(VectorClock.Relation.CONCURRENT);
        assertThat(b.compare(a)).isEqualTo(VectorClock.Relation.CONCURRENT);
    }

    @Test
    void missingDeviceCountedAsZeroInCompare() {
        VectorClock withoutB = VectorClock.of(Map.of("dev-A", 1L));
        VectorClock withB    = VectorClock.of(Map.of("dev-A", 1L, "dev-B", 1L));
        assertThat(withoutB.compare(withB)).isEqualTo(VectorClock.Relation.BEFORE);
        assertThat(withB.compare(withoutB)).isEqualTo(VectorClock.Relation.AFTER);
    }

    // ── of / toMap ─────────────────────────────────────────────────────────

    @Test
    void ofNullReturnsEmptyClock() {
        VectorClock vc = VectorClock.of(null);
        assertThat(vc.get("any")).isEqualTo(0L);
    }

    @Test
    void toMapReturnsDefensiveCopy() {
        VectorClock vc = VectorClock.of(Map.of("A", 1L));
        Map<String, Long> map = vc.toMap();
        map.put("B", 99L);
        assertThat(vc.get("B")).isEqualTo(0L);
    }

    @Test
    void ofEmptyMapReturnsEmptyClock() {
        VectorClock vc = VectorClock.of(Map.of());
        assertThat(vc.get("any")).isEqualTo(0L);
    }
}
