package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Label;

import java.util.UUID;

public record LabelResponse(UUID id, String name, String color) {
    public static LabelResponse from(Label label) {
        return new LabelResponse(label.getId(), label.getName(), label.getColor());
    }
}
