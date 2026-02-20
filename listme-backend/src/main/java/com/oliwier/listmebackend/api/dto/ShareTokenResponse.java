package com.oliwier.listmebackend.api.dto;

import java.util.UUID;

public record ShareTokenResponse(
        String token,
        UUID listId,
        String listName
) {}
