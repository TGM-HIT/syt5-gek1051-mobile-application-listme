package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PresetService {

    private final PresetRepository presetRepository;
    private final PresetItemRepository presetItemRepository;
    private final ShoppingListRepository listRepository;
    private final ItemRepository itemRepository;
    private final ListDeviceRepository listDeviceRepository;

    public List<Preset> getForUser(User user) {
        return presetRepository.findForUser(user.getId());
    }

    public List<PresetItem> getItems(UUID presetId) {
        return presetItemRepository.findByPresetIdOrderByPosition(presetId);
    }

    @Transactional
    public Preset createFromList(User user, Device device, UUID fromListId, String name, String emoji) {
        // Access check: user owns the list OR device is a participant
        ShoppingList list = listRepository.findById(fromListId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        boolean ownsIt = list.getUser() != null && list.getUser().getId().equals(user.getId());
        boolean isParticipant = listDeviceRepository.existsByListIdAndDeviceId(fromListId, device.getId());
        if (!ownsIt && !isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }

        Preset preset = new Preset();
        preset.setName(name);
        preset.setEmoji(emoji != null && !emoji.isBlank() ? emoji : list.getEmoji());
        preset.setCreatedByDevice(device);
        preset.setUser(user);

        List<Item> items = itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(fromListId);
        for (int i = 0; i < items.size(); i++) {
            Item src = items.get(i);
            PresetItem pi = new PresetItem();
            pi.setPreset(preset);
            pi.setName(src.getName());
            pi.setQuantity(src.getQuantity());
            pi.setQuantityUnit(src.getQuantityUnit());
            pi.setPrice(src.getPrice());
            pi.setImageUrl(src.getImageUrl());
            pi.setPosition(i);
            if (src.getCategory() != null) {
                pi.setCategoryName(src.getCategory().getName());
                pi.setCategoryColor(src.getCategory().getColor());
            }
            preset.getItems().add(pi);
        }

        return presetRepository.save(preset);
    }

    @Transactional
    public void delete(User user, UUID presetId) {
        Preset preset = presetRepository.findById(presetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preset not found"));
        if (preset.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "System presets cannot be deleted");
        }
        if (!preset.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your preset");
        }
        presetRepository.delete(preset);
    }
}
