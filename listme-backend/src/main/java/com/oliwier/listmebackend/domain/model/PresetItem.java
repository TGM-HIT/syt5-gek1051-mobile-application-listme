package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "preset_items")
@Getter @Setter @NoArgsConstructor
public class PresetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preset_id", nullable = false)
    private Preset preset;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "quantity_unit", length = 20)
    private String quantityUnit;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private int position = 0;
}
