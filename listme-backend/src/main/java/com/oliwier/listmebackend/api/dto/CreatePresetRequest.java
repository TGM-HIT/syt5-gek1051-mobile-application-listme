package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePresetRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 10) String emoji,
        @NotNull UUID fromListId
) {}
