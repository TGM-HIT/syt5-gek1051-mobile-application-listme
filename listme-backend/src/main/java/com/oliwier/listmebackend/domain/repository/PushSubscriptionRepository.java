package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.PushSubscriptionEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntry, UUID> {
    List<PushSubscriptionEntry> findByUserId(UUID userId);
    Optional<PushSubscriptionEntry> findByEndpoint(String endpoint);
    void deleteByEndpoint(String endpoint);
}
