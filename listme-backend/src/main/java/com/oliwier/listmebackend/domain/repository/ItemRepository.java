package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<Item, UUID> {

    List<Item> findByListIdOrderByPosition(UUID listId);

    int countByListId(UUID listId);

    int countByListIdAndCheckedTrue(UUID listId);
}
