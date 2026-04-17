package com.oliwier.listmebackend.domain.model;

import java.io.Serializable;
import java.util.UUID;

public class DeviceSiblingId implements Serializable {
    private UUID deviceIdA;
    private UUID deviceIdB;

    public DeviceSiblingId() {}
    public DeviceSiblingId(UUID a, UUID b) { this.deviceIdA = a; this.deviceIdB = b; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeviceSiblingId other)) return false;
        return java.util.Objects.equals(deviceIdA, other.deviceIdA) && java.util.Objects.equals(deviceIdB, other.deviceIdB);
    }

    @Override
    public int hashCode() { return java.util.Objects.hash(deviceIdA, deviceIdB); }
}
