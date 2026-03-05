package com.oliwier.listmebackend.api.dto;

import java.math.BigDecimal;

public record ItemHistoryResponse(
        String name,
        String quantityUnit,
        BigDecimal price,
        String imageUrl
) {}
