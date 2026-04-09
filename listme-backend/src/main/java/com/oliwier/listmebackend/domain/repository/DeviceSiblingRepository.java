package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.DeviceSibling;
import com.oliwier.listmebackend.domain.model.DeviceSiblingId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DeviceSiblingRepository extends JpaRepository<DeviceSibling, DeviceSiblingId> {

    @Query("SELECT s.deviceIdB FROM DeviceSibling s WHERE s.deviceIdA = :deviceId")
    List<UUID> findSiblingIds(@Param("deviceId") UUID deviceId);

    /** Returns the subset of deviceIds that are siblings of any device in the same set. */
    @Query("SELECT s.deviceIdB FROM DeviceSibling s WHERE s.deviceIdA IN :deviceIds AND s.deviceIdB IN :deviceIds")
    List<UUID> findSecondaryIds(@Param("deviceIds") java.util.Set<UUID> deviceIds);
}
