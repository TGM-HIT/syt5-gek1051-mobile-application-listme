package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Preset;

import java.time.Instant;
import java.util.UUID;

public record PresetResponse(
        UUID id,
        String name,
        String emoji,
        int itemCount,
        Instant createdAt
) {
    public static PresetResponse from(Preset p) {
        return new PresetResponse(p.getId(), p.getName(), p.getEmoji(), p.getItems().size(), p.getCreatedAt());
    }
}
