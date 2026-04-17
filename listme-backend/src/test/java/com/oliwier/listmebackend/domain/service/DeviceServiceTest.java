package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.repository.DeviceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceServiceTest {

    @Mock DeviceRepository deviceRepository;
    @Mock UserService userService;

    @InjectMocks DeviceService deviceService;

    @Test
    void getOrCreate_returnsExistingDevice_whenFound() {
        UUID deviceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = new User(userId);
        Device existing = new Device(deviceId);
        when(userService.getOrCreate(userId)).thenReturn(user);
        when(deviceRepository.findById(deviceId)).thenReturn(Optional.of(existing));

        Device result = deviceService.getOrCreate(deviceId, userId);

        assertThat(result).isSameAs(existing);
        assertThat(result.getUser()).isEqualTo(user);
        verify(deviceRepository, never()).save(any());
    }

    @Test
    void getOrCreate_createsAndPersistsDevice_whenNotFound() {
        UUID deviceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = new User(userId);
        Device saved = new Device(deviceId);
        when(userService.getOrCreate(userId)).thenReturn(user);
        when(deviceRepository.findById(deviceId)).thenReturn(Optional.empty());
        when(deviceRepository.save(any())).thenReturn(saved);

        Device result = deviceService.getOrCreate(deviceId, userId);

        assertThat(result.getId()).isEqualTo(deviceId);
        verify(deviceRepository).save(any(Device.class));
    }
}
