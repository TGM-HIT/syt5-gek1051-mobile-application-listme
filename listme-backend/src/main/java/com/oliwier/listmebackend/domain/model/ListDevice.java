package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "list_devices")
@Getter @Setter @NoArgsConstructor
public class ListDevice {

    @EmbeddedId
    private ListDeviceId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("listId")
    @JoinColumn(name = "list_id")
    private ShoppingList list;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("deviceId")
    @JoinColumn(name = "device_id")
    private Device device;

    @Column(nullable = false, length = 20)
    private String role = "owner";

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public ListDevice(ShoppingList list, Device device, String role) {
        this.id = new ListDeviceId(list.getId(), device.getId());
        this.list = list;
        this.device = device;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    @PrePersist
    void prePersist() {
        if (joinedAt == null) joinedAt = Instant.now();
    }
}
