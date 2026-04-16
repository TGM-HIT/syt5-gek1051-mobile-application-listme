package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserService userService;

    @Transactional
    public Device getOrCreate(UUID deviceId, UUID userId) {
        User user = userService.getOrCreate(userId);
        Device device = deviceRepository.findById(deviceId)
                .orElseGet(() -> deviceRepository.save(new Device(deviceId)));
        if (device.getUser() == null || !device.getUser().getId().equals(userId)) {
            device.setUser(user);
        }
        return device;
    }
}
