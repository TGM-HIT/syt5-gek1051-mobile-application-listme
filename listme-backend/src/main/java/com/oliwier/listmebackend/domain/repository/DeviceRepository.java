package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
}
