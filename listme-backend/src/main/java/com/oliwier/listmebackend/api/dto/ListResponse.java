package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.ShoppingList;

import java.time.Instant;
import java.util.UUID;

public record ListResponse(
        UUID id,
        String name,
        String emoji,
        String shareToken,
        int itemCount,
        int checkedCount,
        int participantCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static ListResponse from(ShoppingList list) {
        return new ListResponse(
                list.getId(),
                list.getName(),
                list.getEmoji(),
                list.getShareToken(),
                list.getItems().size(),
                (int) list.getItems().stream().filter(i -> i.isChecked()).count(),
                list.getListDevices().size(),
                list.getCreatedAt(),
                list.getUpdatedAt()
        );
    }

    public static ListResponse fromWithCount(ShoppingList list, int itemCount) {
        return new ListResponse(
                list.getId(),
                list.getName(),
                list.getEmoji(),
                list.getShareToken(),
                itemCount,
                0,
                list.getListDevices().size(),
                list.getCreatedAt(),
                list.getUpdatedAt()
        );
    }
}
