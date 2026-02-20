package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.DeviceResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.identity.CurrentDevice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @GetMapping("/me")
    public DeviceResponse me(@CurrentDevice Device device) {
        return DeviceResponse.from(device);
    }
}
