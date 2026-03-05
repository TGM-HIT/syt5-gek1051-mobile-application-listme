package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Item;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ItemResponse(
        UUID id,
        UUID listId,
        String name,
        boolean checked,
        int position,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        BigDecimal quantity,
        String quantityUnit,
        BigDecimal price,
        String imageUrl,
        List<LabelResponse> labels,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt,
        UUID createdByDeviceId
) {
    public static ItemResponse from(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getList().getId(),
                item.getName(),
                item.isChecked(),
                item.getPosition(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getCategory() != null ? item.getCategory().getName() : null,
                item.getCategory() != null ? item.getCategory().getColor() : null,
                item.getQuantity(),
                item.getQuantityUnit(),
                item.getPrice(),
                item.getImageUrl(),
                item.getLabels().stream().map(LabelResponse::from).toList(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getDeletedAt(),
                item.getCreatedByDevice() != null ? item.getCreatedByDevice().getId() : null
        );
    }
}
