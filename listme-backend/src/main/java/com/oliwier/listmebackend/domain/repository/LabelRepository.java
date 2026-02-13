package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabelRepository extends JpaRepository<Label, UUID> {
    List<Label> findByListId(UUID listId);
}
