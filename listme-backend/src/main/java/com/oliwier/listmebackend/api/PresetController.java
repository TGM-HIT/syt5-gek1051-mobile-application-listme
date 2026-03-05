package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreatePresetRequest;
import com.oliwier.listmebackend.api.dto.PresetItemResponse;
import com.oliwier.listmebackend.api.dto.PresetResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.PresetService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/presets")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PresetController {

    private final PresetService presetService;

    @GetMapping
    public List<PresetResponse> getAll(@CurrentDevice Device device) {
        return presetService.getForDevice(device).stream().map(PresetResponse::from).toList();
    }

    @GetMapping("/{presetId}/items")
    public List<PresetItemResponse> getItems(@PathVariable UUID presetId) {
        return presetService.getItems(presetId).stream().map(PresetItemResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PresetResponse create(@CurrentDevice Device device,
                                 @Valid @RequestBody CreatePresetRequest req) {
        return PresetResponse.from(
                presetService.createFromList(device, req.fromListId(), req.name(), req.emoji()));
    }

    @DeleteMapping("/{presetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@CurrentDevice Device device, @PathVariable UUID presetId) {
        presetService.delete(device, presetId);
    }
}
