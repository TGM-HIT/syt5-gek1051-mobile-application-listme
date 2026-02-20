package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    Optional<ShoppingList> findByShareToken(String shareToken);

    @Query("SELECT l FROM ShoppingList l JOIN l.listDevices ld WHERE ld.device.id = :deviceId ORDER BY l.updatedAt DESC")
    List<ShoppingList> findAllByDeviceId(UUID deviceId);
}
