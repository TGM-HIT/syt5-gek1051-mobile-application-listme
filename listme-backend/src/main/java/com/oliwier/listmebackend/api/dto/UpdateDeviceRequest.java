package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateDeviceRequest(
        @Size(max = 100) String displayName,
        String profilePicture
) {}
