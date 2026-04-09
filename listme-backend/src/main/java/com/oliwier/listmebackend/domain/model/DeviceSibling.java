package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "device_siblings")
@IdClass(DeviceSiblingId.class)
@Getter
@NoArgsConstructor
public class DeviceSibling {

    @Id
    @Column(name = "device_id_a")
    private UUID deviceIdA;

    @Id
    @Column(name = "device_id_b")
    private UUID deviceIdB;

    public DeviceSibling(UUID a, UUID b) {
        this.deviceIdA = a;
        this.deviceIdB = b;
    }
}
