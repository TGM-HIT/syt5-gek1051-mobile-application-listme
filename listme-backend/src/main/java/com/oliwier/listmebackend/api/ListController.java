package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateListRequest;
import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.api.dto.ParticipantResponse;
import com.oliwier.listmebackend.api.dto.UpdateListRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ListDevice;
import com.oliwier.listmebackend.domain.model.PresetItem;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.PresetItemRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListController {

    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;
    private final ItemRepository itemRepository;
    private final PresetItemRepository presetItemRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ListResponse create(@CurrentDevice Device device, @Valid @RequestBody CreateListRequest req) {
        ShoppingList list = new ShoppingList();
        list.setId(UUID.randomUUID());
        list.setName(req.name());
        list.setEmoji(req.emoji() != null ? req.emoji() : "\uD83D\uDED2");
        list.setCreatedByDevice(device);

        ListDevice ld = new ListDevice(list, device, "owner");
        list.getListDevices().add(ld);

        list = listRepository.save(list);

        // If a preset was specified, copy its items into the new list (saved explicitly)
        int itemCount = 0;
        if (req.presetId() != null) {
            List<PresetItem> presetItems = presetItemRepository.findByPresetIdOrderByPosition(req.presetId());
            List<Item> items = new java.util.ArrayList<>();
            for (PresetItem pi : presetItems) {
                Item item = new Item();
                item.setList(list);
                item.setName(pi.getName());
                item.setChecked(false);
                item.setPosition(pi.getPosition());
                item.setQuantity(pi.getQuantity());
                item.setQuantityUnit(pi.getQuantityUnit());
                item.setPrice(pi.getPrice());
                item.setImageUrl(pi.getImageUrl());
                item.setCreatedByDevice(device);
                items.add(item);
            }
            itemRepository.saveAll(items);
            itemCount = items.size();
        }

        return ListResponse.fromWithCount(list, itemCount);
    }

    @GetMapping
    public List<ListResponse> getMyLists(@CurrentDevice Device device) {
        return listRepository.findAllByDeviceId(device.getId())
                .stream()
                .map(ListResponse::from)
                .toList();
    }

    @GetMapping("/{listId}")
    public ListResponse getList(@PathVariable UUID listId, @CurrentDevice Device device) {
        return ListResponse.from(requireAccess(listId, device));
    }

    @PutMapping("/{listId}")
    @Transactional
    public ListResponse update(@PathVariable UUID listId,
                               @CurrentDevice Device device,
                               @Valid @RequestBody UpdateListRequest req) {
        ShoppingList list = requireAccess(listId, device);
        list.setName(req.name());
        if (req.emoji() != null) list.setEmoji(req.emoji());
        return ListResponse.from(listRepository.save(list));
    }

    @GetMapping("/{listId}/participants")
    public List<ParticipantResponse> getParticipants(@PathVariable UUID listId, @CurrentDevice Device device) {
        requireAccess(listId, device);
        return listDeviceRepository.findByListId(listId).stream()
                .map(ld -> new ParticipantResponse(ld.getDevice().getId(), ld.getRole(), ld.getJoinedAt(), ld.getDevice().getDisplayName(), ld.getDevice().getProfilePicture()))
                .toList();
    }

    @PostMapping("/{listId}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ListResponse duplicate(@PathVariable UUID listId, @CurrentDevice Device device) {
        ShoppingList orig = requireAccess(listId, device);

        ShoppingList copy = new ShoppingList();
        copy.setId(UUID.randomUUID());
        copy.setName(orig.getName() + " (Kopie)");
        copy.setEmoji(orig.getEmoji());
        copy.setCreatedByDevice(device);
        copy.getListDevices().add(new ListDevice(copy, device, "owner"));

        orig.getItems().forEach(origItem -> {
            Item item = new Item();
            item.setList(copy);
            item.setName(origItem.getName());
            item.setPosition(origItem.getPosition());
            item.setChecked(false);
            item.setCreatedByDevice(device);
            copy.getItems().add(item);
        });

        return ListResponse.from(listRepository.save(copy));
    }

    @DeleteMapping("/{listId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID listId, @CurrentDevice Device device) {
        ShoppingList list = requireAccess(listId, device);

        listDeviceRepository.findByListId(listId).stream()
                .filter(ld -> ld.getDevice().getId().equals(device.getId()))
                .findFirst()
                .ifPresent(listDeviceRepository::delete);

        if (listDeviceRepository.findByListId(listId).isEmpty()) {
            listRepository.delete(list);
        }
    }

    private ShoppingList requireAccess(UUID listId, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }
        return list;
    }
}
