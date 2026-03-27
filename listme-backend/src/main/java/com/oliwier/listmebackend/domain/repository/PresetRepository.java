package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Preset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PresetRepository extends JpaRepository<Preset, UUID> {
    List<Preset> findByCreatedByDeviceIdOrderByCreatedAtDesc(UUID deviceId);

    @Query("""
        SELECT p FROM Preset p
        WHERE p.createdByDevice.id = :deviceId OR p.createdByDevice IS NULL
        ORDER BY CASE WHEN p.createdByDevice IS NULL THEN 1 ELSE 0 END, p.createdAt DESC
        """)
    List<Preset> findForDevice(@Param("deviceId") UUID deviceId);
}
