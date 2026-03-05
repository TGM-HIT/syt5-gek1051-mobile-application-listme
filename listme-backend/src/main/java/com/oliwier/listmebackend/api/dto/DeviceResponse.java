package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Device;

import java.time.Instant;
import java.util.UUID;

public record DeviceResponse(
        UUID id,
        String displayName,
        String profilePicture,
        Instant createdAt
) {
    public static DeviceResponse from(Device device) {
        return new DeviceResponse(device.getId(), device.getDisplayName(), device.getProfilePicture(), device.getCreatedAt());
    }
}
