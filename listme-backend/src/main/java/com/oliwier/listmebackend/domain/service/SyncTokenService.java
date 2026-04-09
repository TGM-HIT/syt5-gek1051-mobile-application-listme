package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.SyncApplyResponse;
import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SyncTokenService {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SyncTokenRepository syncTokenRepository;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;
    private final PresetRepository presetRepository;

    @Transactional
    public SyncToken create(Device device, String theme) {
        List<ShoppingList> deviceLists = listRepository.findAllByDeviceId(device.getId());

        SyncToken syncToken = new SyncToken();
        syncToken.setToken(randomToken(TOKEN_LENGTH));
        syncToken.setCreatedByDevice(device);
        syncToken.setLists(new HashSet<>(deviceLists));
        syncToken.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        syncToken.setDisplayNameSnapshot(device.getDisplayName());
        syncToken.setProfilePictureSnapshot(device.getProfilePicture());
        syncToken.setThemeSnapshot(theme != null && !theme.isBlank() ? theme : "dark");

        return syncTokenRepository.save(syncToken);
    }

    @Transactional(readOnly = true)
    public SyncToken resolve(String token) {
        SyncToken syncToken = syncTokenRepository.findById(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid sync token"));

        if (syncToken.getExpiresAt() != null && syncToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Sync token has expired");
        }
        return syncToken;
    }

    @Transactional
    public SyncApplyResponse apply(String token, Device device) {
        SyncToken syncToken = resolve(token);
        Device source = syncToken.getCreatedByDevice();

        // Add device to all lists
        for (ShoppingList list : syncToken.getLists()) {
            if (!listDeviceRepository.existsByListIdAndDeviceId(list.getId(), device.getId())) {
                listDeviceRepository.save(new ListDevice(list, device, "editor"));
            }
        }

        // Apply source profile to the new device (device is managed — will auto-flush)
        device.setDisplayName(syncToken.getDisplayNameSnapshot());
        device.setProfilePicture(syncToken.getProfilePictureSnapshot());

        // Clone user presets from source to destination (skip if same device)
        int presetsImported = 0;
        if (!source.getId().equals(device.getId())) {
            presetsImported = clonePresets(source, device);
        }

        List<ListResponse> listResponses = syncToken.getLists().stream().map(ListResponse::from).toList();
        return new SyncApplyResponse(
                listResponses,
                syncToken.getDisplayNameSnapshot(),
                syncToken.getProfilePictureSnapshot(),
                syncToken.getThemeSnapshot(),
                presetsImported
        );
    }

    private int clonePresets(Device source, Device destination) {
        List<Preset> sourcePresets = presetRepository.findByCreatedByDeviceIdOrderByCreatedAtDesc(source.getId());
        for (Preset src : sourcePresets) {
            Preset copy = new Preset();
            copy.setName(src.getName());
            copy.setEmoji(src.getEmoji());
            copy.setCreatedByDevice(destination);
            for (PresetItem srcItem : src.getItems()) {
                PresetItem item = new PresetItem();
                item.setPreset(copy);
                item.setName(srcItem.getName());
                item.setQuantity(srcItem.getQuantity());
                item.setQuantityUnit(srcItem.getQuantityUnit());
                item.setPrice(srcItem.getPrice());
                item.setImageUrl(srcItem.getImageUrl());
                item.setPosition(srcItem.getPosition());
                copy.getItems().add(item);
            }
            presetRepository.save(copy);
        }
        return sourcePresets.size();
    }

    private String randomToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
