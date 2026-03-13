package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    List<Favorite> findByDeviceIdOrderByCreatedAtDesc(UUID deviceId);
    boolean existsByDeviceIdAndItemName(UUID deviceId, String itemName);
}
