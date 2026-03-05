package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateLabelRequest(@NotBlank String name, String color) {}
