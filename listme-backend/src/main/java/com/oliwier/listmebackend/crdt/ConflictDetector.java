package com.oliwier.listmebackend.crdt;

import com.oliwier.listmebackend.domain.model.CrdtOperation;

import java.util.ArrayList;
import java.util.List;

/**
 * Detects conflicting (concurrent) operations in a list of CRDT operations.
 *
 * Two operations on the same target (same itemId) are concurrent if
 * neither of their vector clocks is causally before the other.
 */
public class ConflictDetector {

    public record Conflict(CrdtOperation a, CrdtOperation b) {}

    /**
     * Returns all pairs of operations that are CONCURRENT on the same item.
     * Caller is responsible for applying merge strategy to resolve them.
     */
    public static List<Conflict> detect(List<CrdtOperation> ops) {
        List<Conflict> conflicts = new ArrayList<>();

        for (int i = 0; i < ops.size(); i++) {
            for (int j = i + 1; j < ops.size(); j++) {
                CrdtOperation a = ops.get(i);
                CrdtOperation b = ops.get(j);

                // Only compare ops that target the same item
                if (!sameTarget(a, b)) continue;

                VectorClock clockA = VectorClock.of(a.getVectorClock());
                VectorClock clockB = VectorClock.of(b.getVectorClock());

                if (clockA.compare(clockB) == VectorClock.Relation.CONCURRENT) {
                    conflicts.add(new Conflict(a, b));
                }
            }
        }
        return conflicts;
    }

    /** Extract itemId from payload for target comparison. */
    private static boolean sameTarget(CrdtOperation a, CrdtOperation b) {
        Object targetA = a.getPayload().get("itemId");
        Object targetB = b.getPayload().get("itemId");
        if (targetA == null || targetB == null) return false;
        return targetA.equals(targetB);
    }
}
