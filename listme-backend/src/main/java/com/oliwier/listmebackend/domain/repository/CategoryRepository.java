package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByListIdOrderByPosition(UUID listId);
}
