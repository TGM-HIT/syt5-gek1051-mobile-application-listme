package com.oliwier.listmebackend.api.dto;

import java.time.Instant;
import java.util.UUID;

public record ParticipantResponse(
        UUID deviceId,
        String role,
        Instant joinedAt,
        String displayName,
        String profilePicture
) {}
