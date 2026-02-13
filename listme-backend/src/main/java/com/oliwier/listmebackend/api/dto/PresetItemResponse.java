package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.PresetItem;

import java.math.BigDecimal;
import java.util.UUID;

public record PresetItemResponse(
        UUID id,
        String name,
        BigDecimal quantity,
        String quantityUnit,
        BigDecimal price,
        String imageUrl
) {
    public static PresetItemResponse from(PresetItem i) {
        return new PresetItemResponse(
                i.getId(), i.getName(),
                i.getQuantity(), i.getQuantityUnit(),
                i.getPrice(), i.getImageUrl());
    }
}
