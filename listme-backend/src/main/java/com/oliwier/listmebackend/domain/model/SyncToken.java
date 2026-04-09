package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sync_tokens")
@Getter @Setter @NoArgsConstructor
public class SyncToken {

    @Id
    @Column(length = 32)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_device", nullable = false, updatable = false)
    private Device createdByDevice;

    @ManyToMany
    @JoinTable(
        name = "sync_token_lists",
        joinColumns = @JoinColumn(name = "sync_token"),
        inverseJoinColumns = @JoinColumn(name = "list_id")
    )
    private Set<ShoppingList> lists = new HashSet<>();

    @Column(name = "display_name_snapshot", length = 100)
    private String displayNameSnapshot;

    @Column(name = "profile_picture_snapshot", columnDefinition = "TEXT")
    private String profilePictureSnapshot;

    @Column(name = "theme_snapshot", length = 20, nullable = false)
    private String themeSnapshot = "dark";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
