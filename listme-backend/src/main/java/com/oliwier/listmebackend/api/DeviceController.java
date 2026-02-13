package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.DeviceResponse;
import com.oliwier.listmebackend.api.dto.UpdateDeviceRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.repository.DeviceRepository;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceController {

    private final DeviceRepository deviceRepository;

    @GetMapping("/me")
    public DeviceResponse me(@CurrentDevice Device device) {
        return DeviceResponse.from(device);
    }

    @PatchMapping("/me")
    @Transactional
    public DeviceResponse updateMe(@CurrentDevice Device device,
                                   @Valid @RequestBody UpdateDeviceRequest req) {
        device.setDisplayName(req.displayName());
        device.setProfilePicture(req.profilePicture());
        return DeviceResponse.from(deviceRepository.save(device));
    }

    @GetMapping("/{deviceId}")
    public DeviceResponse getDevice(@PathVariable UUID deviceId) {
        return deviceRepository.findById(deviceId)
                .map(DeviceResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found"));
    }
}
