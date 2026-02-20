package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class ListDeviceId implements Serializable {

    @Column(name = "list_id")
    private UUID listId;

    @Column(name = "device_id")
    private UUID deviceId;
}
