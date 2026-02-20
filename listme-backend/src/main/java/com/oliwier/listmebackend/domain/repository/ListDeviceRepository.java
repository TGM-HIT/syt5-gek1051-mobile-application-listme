package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.ListDevice;
import com.oliwier.listmebackend.domain.model.ListDeviceId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListDeviceRepository extends JpaRepository<ListDevice, ListDeviceId> {

    List<ListDevice> findByDeviceId(UUID deviceId);

    List<ListDevice> findByListId(UUID listId);

    boolean existsByListIdAndDeviceId(UUID listId, UUID deviceId);
}
