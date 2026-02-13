package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.PresetItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PresetItemRepository extends JpaRepository<PresetItem, UUID> {
    List<PresetItem> findByPresetIdOrderByPosition(UUID presetId);
}
