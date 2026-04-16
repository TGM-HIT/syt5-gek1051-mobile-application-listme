package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 100) String displayName,
        String profilePicture,
        @Size(max = 20) String theme
) {}
