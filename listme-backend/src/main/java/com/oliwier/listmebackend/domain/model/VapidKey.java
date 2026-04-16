package com.oliwier.listmebackend.domain.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vapid_keys")
@Data
public class VapidKey {

    @Id
    private Short id = 1;

    @Column(name = "public_key", nullable = false)
    private String publicKey;

    @Column(name = "private_key", nullable = false)
    private String privateKey;
}
