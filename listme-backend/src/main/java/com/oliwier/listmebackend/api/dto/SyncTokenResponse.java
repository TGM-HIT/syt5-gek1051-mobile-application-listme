package com.oliwier.listmebackend.api.dto;

import java.time.Instant;

public record SyncTokenResponse(
        String token,
        int listCount,
        Instant expiresAt
) {}
