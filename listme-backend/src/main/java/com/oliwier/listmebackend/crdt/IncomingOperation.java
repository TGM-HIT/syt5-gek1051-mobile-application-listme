package com.oliwier.listmebackend.crdt;

import java.util.Map;
import java.util.UUID;

/**
 * Represents a CRDT operation sent from a client device to the server.
 * The ID is generated client-side for idempotency.
 */
public record IncomingOperation(
        UUID id,
        UUID listId,
        String operationType,
        Map<String, Object> payload,
        Map<String, Long> vectorClock
) {}
