package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "items")
public class Item {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id", nullable = false)
    private ShoppingList list;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(nullable = false)
    private boolean checked;

    @Column(nullable = false)
    private int position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_device", nullable = false, updatable = false)
    private Device createdByDevice;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "quantity_unit", length = 20)
    private String quantityUnit;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToMany
    @JoinTable(
            name = "item_labels",
            joinColumns = @JoinColumn(name = "item_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    private Set<Label> labels = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Item() {}

    // --- Getters ---

    public UUID getId() { return id; }
    public ShoppingList getList() { return list; }
    public String getName() { return name; }
    public boolean isChecked() { return checked; }
    public int getPosition() { return position; }
    public Category getCategory() { return category; }
    public Device getCreatedByDevice() { return createdByDevice; }
    public BigDecimal getQuantity() { return quantity; }
    public String getQuantityUnit() { return quantityUnit; }
    public BigDecimal getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }
    public Set<Label> getLabels() { return labels; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDeletedAt() { return deletedAt; }

    // --- Setters ---

    public void setId(UUID id) { this.id = id; }
    public void setList(ShoppingList list) { this.list = list; }
    public void setName(String name) { this.name = name; }
    public void setChecked(boolean checked) { this.checked = checked; }
    public void setPosition(int position) { this.position = position; }
    public void setCategory(Category category) { this.category = category; }
    public void setCreatedByDevice(Device createdByDevice) { this.createdByDevice = createdByDevice; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setQuantityUnit(String quantityUnit) { this.quantityUnit = quantityUnit; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setLabels(Set<Label> labels) { this.labels = labels; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    // --- Lifecycle Callbacks ---

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
