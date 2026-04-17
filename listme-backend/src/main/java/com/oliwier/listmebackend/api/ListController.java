package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateListRequest;
import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.api.dto.ParticipantResponse;
import com.oliwier.listmebackend.api.dto.UpdateListRequest;
import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import com.oliwier.listmebackend.identity.CurrentDevice;
import com.oliwier.listmebackend.identity.CurrentUser;
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
    private final DeviceSiblingRepository deviceSiblingRepository;
    private final SimpMessagingTemplate messaging;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ListResponse create(@CurrentUser User user,
                               @CurrentDevice Device device,
                               @Valid @RequestBody CreateListRequest req) {
        ShoppingList list = new ShoppingList();
        list.setId(UUID.randomUUID());
        list.setName(req.name());
        list.setEmoji(req.emoji() != null ? req.emoji() : "\uD83D\uDED2");
        list.setCreatedByDevice(device);
        list.setUser(user);

        ListDevice ld = new ListDevice(list, device, "owner");
        list.getListDevices().add(ld);

        final ShoppingList savedList = listRepository.save(list);

        // Notify this user's other devices (same userId) via WebSocket
        messaging.convertAndSend("/topic/user/" + user.getId(), (Object) Map.of("type", "LIST_ADDED"));

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
    public List<ListResponse> getMyLists(@CurrentUser User user, @CurrentDevice Device device) {
        // Owned lists (primary identity via userId)
        List<ShoppingList> owned = listRepository.findByUserOrderByUpdatedAtDesc(user);
        Set<UUID> ownedIds = owned.stream().map(ShoppingList::getId).collect(Collectors.toSet());

        // Shared lists: device was added as editor via a share token (user_id belongs to someone else)
        List<ShoppingList> shared = listRepository.findSharedWithDevice(device.getId(), user.getId());

        List<ShoppingList> all = new ArrayList<>(owned);
        all.addAll(shared.stream().filter(l -> !ownedIds.contains(l.getId())).toList());
        all.sort(Comparator.comparing(ShoppingList::getUpdatedAt).reversed());

        return all.stream().map(ListResponse::from).toList();
    }

    @GetMapping("/{listId}")
    public ListResponse getList(@PathVariable UUID listId,
                                @CurrentUser User user,
                                @CurrentDevice Device device) {
        return ListResponse.from(requireAccess(listId, user, device));
    }

    @PutMapping("/{listId}")
    @Transactional
    public ListResponse update(@PathVariable UUID listId,
                               @CurrentUser User user,
                               @CurrentDevice Device device,
                               @Valid @RequestBody UpdateListRequest req) {
        ShoppingList list = requireAccess(listId, user, device);
        list.setName(req.name());
        if (req.emoji() != null) list.setEmoji(req.emoji());
        return ListResponse.from(listRepository.save(list));
    }

    @GetMapping("/{listId}/participants")
    public List<ParticipantResponse> getParticipants(@PathVariable UUID listId,
                                                     @CurrentUser User user,
                                                     @CurrentDevice Device device) {
        requireAccess(listId, user, device);
        List<ListDevice> all = listDeviceRepository.findByListId(listId);

        Set<UUID> allIds = all.stream()
                .map(l -> l.getDevice().getId())
                .collect(Collectors.toSet());

        Set<UUID> excluded = new HashSet<>();
        all.stream()
                .sorted(Comparator.comparing((ListDevice l) -> "owner".equals(l.getRole()) ? 0 : 1)
                        .thenComparing(ListDevice::getJoinedAt))
                .forEach(l -> {
                    UUID id = l.getDevice().getId();
                    if (excluded.contains(id)) return;
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
    public ListResponse duplicate(@PathVariable UUID listId,
                                  @CurrentUser User user,
                                  @CurrentDevice Device device) {
        ShoppingList orig = requireAccess(listId, user, device);

        ShoppingList copy = new ShoppingList();
        copy.setId(UUID.randomUUID());
        copy.setName(orig.getName() + " (Kopie)");
        copy.setEmoji(orig.getEmoji());
        copy.setCreatedByDevice(device);
        copy.setUser(user);
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
    public void delete(@PathVariable UUID listId,
                       @CurrentUser User user,
                       @CurrentDevice Device device) {
        ShoppingList list = requireAccess(listId, user, device);

        // If this user owns the list, delete it entirely
        if (list.getUser() != null && list.getUser().getId().equals(user.getId())) {
            listRepository.delete(list);
            return;
        }

        // Otherwise just remove this device's access (shared list)
        listDeviceRepository.findByListId(listId).stream()
                .filter(ld -> ld.getDevice().getId().equals(device.getId()))
                .findFirst()
                .ifPresent(listDeviceRepository::delete);
    }

    private ShoppingList requireAccess(UUID listId, User user, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));

        // Owner: list belongs to this user
        if (list.getUser() != null && list.getUser().getId().equals(user.getId())) {
            return list;
        }
        // Editor: device was added via share token
        if (listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            return list;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
    }
}
