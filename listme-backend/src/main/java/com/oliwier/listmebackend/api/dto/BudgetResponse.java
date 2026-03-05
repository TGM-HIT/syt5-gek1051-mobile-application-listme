package com.oliwier.listmebackend.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record BudgetResponse(BigDecimal total, Map<String, BigDecimal> byCategory) {}
