package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    Optional<ShoppingList> findByShareToken(String shareToken);

    List<ShoppingList> findByUserOrderByUpdatedAtDesc(User user);

    /** Lists where the device is an editor (shared via share token) but does not own them */
    @Query("""
        SELECT l FROM ShoppingList l
        JOIN l.listDevices ld
        WHERE ld.device.id = :deviceId
          AND (l.user IS NULL OR l.user.id <> :userId)
        ORDER BY l.updatedAt DESC
        """)
    List<ShoppingList> findSharedWithDevice(@Param("deviceId") UUID deviceId,
                                            @Param("userId") UUID userId);

    @Query("SELECT l FROM ShoppingList l JOIN l.listDevices ld WHERE ld.device.id = :deviceId ORDER BY l.updatedAt DESC")
    List<ShoppingList> findAllByDeviceId(UUID deviceId);
}
