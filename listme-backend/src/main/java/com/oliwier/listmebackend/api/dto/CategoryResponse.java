package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Category;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String color,
        int position
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getColor(), c.getPosition());
    }
}
