package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.CrdtOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CrdtOperationRepository extends JpaRepository<CrdtOperation, UUID> {

    List<CrdtOperation> findByListIdOrderByCreatedAtAsc(UUID listId);
}
