package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.CrdtOperation;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record CrdtOperationResponse(
        UUID id,
        UUID listId,
        UUID deviceId,
        String operationType,
        Map<String, Object> payload,
        Map<String, Long> vectorClock,
        Instant createdAt
) {
    public static CrdtOperationResponse from(CrdtOperation op) {
        return new CrdtOperationResponse(
                op.getId(),
                op.getList().getId(),
                op.getDevice().getId(),
                op.getOperationType(),
                op.getPayload(),
                op.getVectorClock(),
                op.getCreatedAt()
        );
    }
}
