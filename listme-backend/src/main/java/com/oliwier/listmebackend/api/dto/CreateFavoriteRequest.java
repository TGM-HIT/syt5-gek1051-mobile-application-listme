package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFavoriteRequest(@NotBlank String itemName, String emoji) {}
