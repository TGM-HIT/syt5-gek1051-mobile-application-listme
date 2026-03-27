package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateItemRequest;
import com.oliwier.listmebackend.api.dto.UpdateItemRequest;
import com.oliwier.listmebackend.crdt.OperationType;
import com.oliwier.listmebackend.crdt.SyncEngine;
import com.oliwier.listmebackend.domain.model.CrdtOperation;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.CategoryRepository;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import com.oliwier.listmebackend.domain.repository.LabelRepository;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.notification.NotificationService;
import com.oliwier.listmebackend.websocket.ListSyncBroadcaster;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;
    private final CategoryRepository categoryRepository;
    private final LabelRepository labelRepository;
    private final SyncEngine syncEngine;
    private final ListSyncBroadcaster broadcaster;
    private final NotificationService notificationService;

    public List<Item> getByList(UUID listId, Device device, String q) {
        requireAccess(listId, device);
        if (q == null || q.isBlank()) {
            return itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId);
        }
        return itemRepository.findByListIdAndNameContainingIgnoreCaseAndDeletedAtIsNullOrderByPosition(listId, q);
    }

    public List<Item> getTrash(UUID listId, Device device) {
        requireAccess(listId, device);
        return itemRepository.findByListIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(listId);
    }

    @Transactional
    public Item create(UUID listId, Device device, CreateItemRequest req) {
        ShoppingList list = requireAccess(listId, device);

        Item item = new Item();
        item.setList(list);
        item.setName(req.name());
        item.setChecked(false);
        item.setPosition(itemRepository.countByListIdAndDeletedAtIsNull(listId));
        item.setCreatedByDevice(device);

        if (req.categoryId() != null) {
            categoryRepository.findById(req.categoryId()).ifPresent(item::setCategory);
        }
        if (req.labelIds() != null && !req.labelIds().isEmpty()) {
            item.setLabels(new java.util.HashSet<>(labelRepository.findAllById(req.labelIds())));
        }
        item.setQuantity(req.quantity());
        item.setQuantityUnit(req.quantityUnit());
        item.setPrice(req.price());
        item.setImageUrl(req.imageUrl());

        item = itemRepository.save(item);

        CrdtOperation op = syncEngine.record(list, device, OperationType.ITEM_CREATE, Map.of(
                "itemId", item.getId().toString(),
                "name", item.getName(),
                "position", item.getPosition(),
                "timestamp", Instant.now().toEpochMilli()
        ));
        broadcaster.broadcastOp(list.getId(), op);

        return item;
    }

    @Transactional
    public Item update(UUID listId, UUID itemId, Device device, UpdateItemRequest req) {
        ShoppingList list = requireAccess(listId, device);
        Item item = requireItem(itemId, listId);

        item.setName(req.name());
        if (req.categoryId() != null) {
            categoryRepository.findById(req.categoryId()).ifPresent(item::setCategory);
        } else {
            item.setCategory(null);
        }
        if (req.labelIds() != null) {
            item.setLabels(new java.util.HashSet<>(labelRepository.findAllById(req.labelIds())));
        }
        item.setQuantity(req.quantity());
        item.setQuantityUnit(req.quantityUnit());
        item.setPrice(req.price());
        item.setImageUrl(req.imageUrl());

        item = itemRepository.save(item);

        CrdtOperation op = syncEngine.record(list, device, OperationType.ITEM_UPDATE, Map.of(
                "itemId", item.getId().toString(),
                "name", item.getName(),
                "timestamp", Instant.now().toEpochMilli()
        ));
        broadcaster.broadcastOp(list.getId(), op);

        return item;
    }

    @Transactional
    public Item toggleCheck(UUID listId, UUID itemId, Device device) {
        ShoppingList list = requireAccess(listId, device);
        Item item = requireItem(itemId, listId);
        item.setChecked(!item.isChecked());
        item = itemRepository.save(item);

        CrdtOperation op = syncEngine.record(list, device, OperationType.ITEM_CHECK, Map.of(
                "itemId", item.getId().toString(),
                "checked", item.isChecked(),
                "timestamp", Instant.now().toEpochMilli()
        ));
        broadcaster.broadcastOp(list.getId(), op);
        notificationService.notifyItemChecked(list, item, device);

        return item;
    }

    /** Soft delete — moves item to trash. */
    @Transactional
    public void delete(UUID listId, UUID itemId, Device device) {
        ShoppingList list = requireAccess(listId, device);
        Item item = requireItem(itemId, listId);
        item.setDeletedAt(Instant.now());
        itemRepository.save(item);

        CrdtOperation op = syncEngine.record(list, device, OperationType.ITEM_DELETE, Map.of(
                "itemId", itemId.toString(),
                "timestamp", Instant.now().toEpochMilli()
        ));
        broadcaster.broadcastOp(list.getId(), op);
        notificationService.notifyItemDeleted(list, item, device);
    }

    /** Restore a trashed item to the active list. */
    @Transactional
    public Item restore(UUID listId, UUID itemId, Device device) {
        requireAccess(listId, device);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getList().getId().equals(listId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this list");
        }
        item.setDeletedAt(null);
        return itemRepository.save(item);
    }

    /** Permanently remove a trashed item — no recovery possible. */
    @Transactional
    public void permanentDelete(UUID listId, UUID itemId, Device device) {
        requireAccess(listId, device);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getList().getId().equals(listId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this list");
        }
        itemRepository.delete(item);
    }

    private ShoppingList requireAccess(UUID listId, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }
        return list;
    }

    private Item requireItem(UUID itemId, UUID listId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getList().getId().equals(listId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this list");
        }
        if (item.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Item is in trash");
        }
        return item;
    }
}
