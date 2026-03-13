package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.VectorClockEntry;
import com.oliwier.listmebackend.domain.model.VectorClockEntryId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VectorClockEntryRepository extends JpaRepository<VectorClockEntry, VectorClockEntryId> {
    List<VectorClockEntry> findByListId(UUID listId);
}
