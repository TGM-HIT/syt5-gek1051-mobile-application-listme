package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
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

    @InjectMocks DeviceService deviceService;

    @Test
    void getOrCreate_returnsExistingDevice_whenFound() {
        UUID id = UUID.randomUUID();
        Device existing = new Device(id);
        when(deviceRepository.findById(id)).thenReturn(Optional.of(existing));

        Device result = deviceService.getOrCreate(id);

        assertThat(result).isSameAs(existing);
        verify(deviceRepository, never()).save(any());
    }

    @Test
    void getOrCreate_createsAndPersistsDevice_whenNotFound() {
        UUID id = UUID.randomUUID();
        Device saved = new Device(id);
        when(deviceRepository.findById(id)).thenReturn(Optional.empty());
        when(deviceRepository.save(any())).thenReturn(saved);

        Device result = deviceService.getOrCreate(id);

        assertThat(result.getId()).isEqualTo(id);
        verify(deviceRepository).save(any(Device.class));
    }
}
