package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "labels")
@Getter @Setter @NoArgsConstructor
public class Label {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 7)
    private String color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id", nullable = false)
    private ShoppingList list;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }
}
