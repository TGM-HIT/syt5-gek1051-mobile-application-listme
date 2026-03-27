package com.oliwier.listmebackend.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    List<PushSubscription> findByDeviceId(UUID deviceId);

    Optional<PushSubscription> findByDeviceIdAndEndpoint(UUID deviceId, String endpoint);

    void deleteByDeviceIdAndEndpoint(UUID deviceId, String endpoint);
}
