package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Preset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PresetRepository extends JpaRepository<Preset, UUID> {
    List<Preset> findByCreatedByDeviceIdOrderByCreatedAtDesc(UUID deviceId);
}
