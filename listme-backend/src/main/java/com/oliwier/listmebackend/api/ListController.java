package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateListRequest;
import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.api.dto.ParticipantResponse;
import com.oliwier.listmebackend.api.dto.UpdateListRequest;
import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListController {

    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;
    private final ItemRepository itemRepository;
    private final PresetItemRepository presetItemRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceSiblingRepository deviceSiblingRepository;
    private final SimpMessagingTemplate messaging;

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

        final ShoppingList savedList = listRepository.save(list);

        // Add sibling devices to the new list so they see it immediately
        List<UUID> siblingIds = deviceSiblingRepository.findSiblingIds(device.getId());
        for (UUID siblingId : siblingIds) {
            deviceRepository.findById(siblingId).ifPresent(sibling ->
                listDeviceRepository.save(new ListDevice(savedList, sibling, "owner"))
            );
            // Notify the sibling device via WebSocket so its HomeView refreshes live
            messaging.convertAndSend("/topic/device/" + siblingId, (Object) Map.of("type", "LIST_ADDED"));
        }

        // If a preset was specified, copy its items into the new list
        int itemCount = 0;
        if (req.presetId() != null) {
            List<PresetItem> presetItems = presetItemRepository.findByPresetIdOrderByPosition(req.presetId());
            List<Item> items = new ArrayList<>();
            for (PresetItem pi : presetItems) {
                Item item = new Item();
                item.setList(savedList);
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

        return ListResponse.fromWithCount(savedList, itemCount);
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
        List<ListDevice> all = listDeviceRepository.findByListId(listId);

        // Deduplicate: sibling devices share the same identity — show only one per group.
        // Process in priority order (owner first, then earliest joined_at) so the
        // most prominent device in each sibling cluster is kept.
        Set<UUID> allIds = all.stream()
                .map(l -> l.getDevice().getId())
                .collect(Collectors.toSet());

        // A "secondary" device is only excluded when a sibling with higher priority
        // (owner or earlier join) is also present. Walk in priority order and mark
        // each device's siblings as excluded once the primary is encountered.
        Set<UUID> excluded = new HashSet<>();
        all.stream()
                .sorted(Comparator.comparing((ListDevice l) -> "owner".equals(l.getRole()) ? 0 : 1)
                        .thenComparing(ListDevice::getJoinedAt))
                .forEach(l -> {
                    UUID id = l.getDevice().getId();
                    if (excluded.contains(id)) return;
                    // Mark all siblings of this device that are in this list as excluded
                    deviceSiblingRepository.findSiblingIds(id).stream()
                            .filter(allIds::contains)
                            .forEach(excluded::add);
                });

        return all.stream()
                .filter(l -> !excluded.contains(l.getDevice().getId()))
                .map(l -> new ParticipantResponse(
                        l.getDevice().getId(), l.getRole(), l.getJoinedAt(),
                        l.getDevice().getDisplayName(), l.getDevice().getProfilePicture()))
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
