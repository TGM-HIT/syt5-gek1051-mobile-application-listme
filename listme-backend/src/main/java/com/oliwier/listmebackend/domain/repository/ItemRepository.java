package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<Item, UUID> {

    // Active items (not deleted)
    List<Item> findByListIdAndDeletedAtIsNullOrderByPosition(UUID listId);

    List<Item> findByListIdAndNameContainingIgnoreCaseAndDeletedAtIsNullOrderByPosition(UUID listId, String name);

    int countByListIdAndDeletedAtIsNull(UUID listId);

    int countByListIdAndCheckedTrueAndDeletedAtIsNull(UUID listId);

    // Trashed items
    List<Item> findByListIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(UUID listId);

    // Item history for a device — one row per unique name (most recent wins)
    @Query(value = """
            SELECT DISTINCT ON (lower(i.name))
                i.name, i.quantity_unit, i.price, i.image_url
            FROM items i
            JOIN list_devices ld ON ld.list_id = i.list_id
            WHERE ld.device_id = CAST(:deviceId AS uuid)
              AND (:prefix = '' OR lower(i.name) LIKE lower(:prefix) || '%')
              AND i.deleted_at IS NULL
            ORDER BY lower(i.name), i.created_at DESC
            LIMIT :lim
            """, nativeQuery = true)
    List<Object[]> findHistoryRaw(@Param("deviceId") String deviceId,
                                  @Param("prefix") String prefix,
                                  @Param("lim") int lim);
}
