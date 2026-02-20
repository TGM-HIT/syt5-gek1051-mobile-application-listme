package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;

    @Transactional
    public Device getOrCreate(UUID deviceId) {
        return deviceRepository.findById(deviceId)
                .orElseGet(() -> deviceRepository.save(new Device(deviceId)));
    }
}
