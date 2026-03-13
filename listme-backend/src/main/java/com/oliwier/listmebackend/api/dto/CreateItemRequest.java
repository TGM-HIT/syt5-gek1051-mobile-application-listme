package com.oliwier.listmebackend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CreateItemRequest {

    @NotBlank
    @Size(max = 500)
    private String name;

    private UUID categoryId;

    private List<UUID> labelIds;

    private BigDecimal quantity;

    private String quantityUnit;

    private BigDecimal price;

    private String imageUrl;

    public CreateItemRequest() {}

    public CreateItemRequest(
            String name,
            UUID categoryId,
            List<UUID> labelIds,
            BigDecimal quantity,
            String quantityUnit,
            BigDecimal price,
            String imageUrl
    ) {
        this.name = name;
        this.categoryId = categoryId;
        this.labelIds = labelIds;
        this.quantity = quantity;
        this.quantityUnit = quantityUnit;
        this.price = price;
        this.imageUrl = imageUrl;
    }

    // --- Getters ---

    public String getName() { return name; }
    public UUID getCategoryId() { return categoryId; }
    public List<UUID> getLabelIds() { return labelIds; }
    public BigDecimal getQuantity() { return quantity; }
    public String getQuantityUnit() { return quantityUnit; }
    public BigDecimal getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }

    // --- Setters ---

    public void setName(String name) { this.name = name; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public void setLabelIds(List<UUID> labelIds) { this.labelIds = labelIds; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setQuantityUnit(String quantityUnit) { this.quantityUnit = quantityUnit; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}