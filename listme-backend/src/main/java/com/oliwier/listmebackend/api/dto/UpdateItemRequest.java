package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UpdateItemRequest(
        @NotBlank @Size(max = 500) String name,
        UUID categoryId,
        List<UUID> labelIds,
        BigDecimal quantity,
        String quantityUnit,
        BigDecimal price,
        String imageUrl
) {}
