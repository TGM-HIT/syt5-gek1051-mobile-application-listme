package com.oliwier.listmebackend.crdt;

import com.oliwier.listmebackend.domain.model.CrdtOperation;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ConflictDetectorTest {

    /** Build a minimal CrdtOperation with a given itemId and vector clock. */
    private static CrdtOperation op(String itemId, Map<String, Long> clock) {
        CrdtOperation op = new CrdtOperation();
        op.setPayload(Map.of("itemId", itemId));
        op.setVectorClock(clock);
        return op;
    }

    // ── edge cases ─────────────────────────────────────────────────────────

    @Test
    void emptyListReturnsNoConflicts() {
        assertThat(ConflictDetector.detect(List.of())).isEmpty();
    }

    @Test
    void singleOpReturnsNoConflicts() {
        assertThat(ConflictDetector.detect(List.of(
                op("item-1", Map.of("dev-A", 1L))
        ))).isEmpty();
    }

    // ── same target, causal (no conflict) ─────────────────────────────────

    @Test
    void causalOpsOnSameItemAreNotConflicts() {
        // dev-B saw dev-A's op before making its own — causal, not concurrent
        CrdtOperation op1 = op("item-1", Map.of("dev-A", 1L, "dev-B", 0L));
        CrdtOperation op2 = op("item-1", Map.of("dev-A", 1L, "dev-B", 1L));
        assertThat(ConflictDetector.detect(List.of(op1, op2))).isEmpty();
    }

    @Test
    void afterRelationOnSameItemIsNotConflict() {
        CrdtOperation older = op("item-1", Map.of("A", 1L));
        CrdtOperation newer = op("item-1", Map.of("A", 3L));
        assertThat(ConflictDetector.detect(List.of(older, newer))).isEmpty();
    }

    @Test
    void equalClocksOnSameItemAreNotConflicts() {
        CrdtOperation a = op("item-1", Map.of("dev-A", 2L));
        CrdtOperation b = op("item-1", Map.of("dev-A", 2L));
        assertThat(ConflictDetector.detect(List.of(a, b))).isEmpty();
    }

    // ── same target, concurrent (conflict) ────────────────────────────────

    @Test
    void concurrentOpsOnSameItemAreConflict() {
        CrdtOperation opA = op("item-1", Map.of("dev-A", 2L, "dev-B", 1L));
        CrdtOperation opB = op("item-1", Map.of("dev-A", 1L, "dev-B", 2L));
        List<ConflictDetector.Conflict> conflicts = ConflictDetector.detect(List.of(opA, opB));
        assertThat(conflicts).hasSize(1);
        assertThat(conflicts.get(0).a()).isSameAs(opA);
        assertThat(conflicts.get(0).b()).isSameAs(opB);
    }

    // ── different targets ─────────────────────────────────────────────────

    @Test
    void concurrentOpsOnDifferentItemsAreNotConflicts() {
        CrdtOperation opA = op("item-1", Map.of("dev-A", 2L, "dev-B", 1L));
        CrdtOperation opB = op("item-2", Map.of("dev-A", 1L, "dev-B", 2L));
        assertThat(ConflictDetector.detect(List.of(opA, opB))).isEmpty();
    }

    // ── missing itemId ────────────────────────────────────────────────────

    @Test
    void opWithNullItemIdIsSkipped() {
        CrdtOperation noTarget = new CrdtOperation();
        noTarget.setPayload(Map.of("name", "no item id"));
        noTarget.setVectorClock(Map.of("dev-A", 1L));
        CrdtOperation normal = op("item-1", Map.of("dev-A", 2L, "dev-B", 1L));
        assertThat(ConflictDetector.detect(List.of(noTarget, normal))).isEmpty();
    }

    // ── multiple conflicts ────────────────────────────────────────────────

    @Test
    void multipleConflictsOnDistinctItemsAllDetected() {
        CrdtOperation a1 = op("item-1", Map.of("dev-A", 2L, "dev-B", 1L));
        CrdtOperation b1 = op("item-1", Map.of("dev-A", 1L, "dev-B", 2L));
        CrdtOperation a2 = op("item-2", Map.of("dev-A", 3L, "dev-B", 1L));
        CrdtOperation b2 = op("item-2", Map.of("dev-A", 1L, "dev-B", 3L));
        assertThat(ConflictDetector.detect(List.of(a1, b1, a2, b2))).hasSize(2);
    }

    @Test
    void threeWayConcurrentOpsYieldThreeConflictPairs() {
        // Three devices each modified the same item without seeing each other
        CrdtOperation opA = op("item-1", Map.of("dev-A", 1L, "dev-B", 0L, "dev-C", 0L));
        CrdtOperation opB = op("item-1", Map.of("dev-A", 0L, "dev-B", 1L, "dev-C", 0L));
        CrdtOperation opC = op("item-1", Map.of("dev-A", 0L, "dev-B", 0L, "dev-C", 1L));
        // pairs: (A,B), (A,C), (B,C)
        assertThat(ConflictDetector.detect(List.of(opA, opB, opC))).hasSize(3);
    }
}
