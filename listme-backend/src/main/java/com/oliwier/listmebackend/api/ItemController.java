package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateItemRequest;
import com.oliwier.listmebackend.api.dto.ItemResponse;
import com.oliwier.listmebackend.api.dto.UpdateItemRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.ItemService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/items")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemController {

    private final ItemService itemService;
    private final SimpMessagingTemplate messaging;

    @GetMapping
    public List<ItemResponse> getItems(@PathVariable UUID listId,
                                       @CurrentDevice Device device,
                                       @RequestParam(required = false) String q) {
        return itemService.getByList(listId, device, q).stream().map(ItemResponse::from).toList();
    }

    @GetMapping("/trash")
    public List<ItemResponse> getTrash(@PathVariable UUID listId,
                                       @CurrentDevice Device device) {
        return itemService.getTrash(listId, device).stream().map(ItemResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ItemResponse create(@PathVariable UUID listId,
                               @CurrentDevice Device device,
                               @Valid @RequestBody CreateItemRequest req) {
        ItemResponse item = ItemResponse.from(itemService.create(listId, device, req));
        broadcast(listId, device, "ITEM_CREATE",
                Map.of("itemId", item.id(), "name", item.name(), "position", item.position()));
        return item;
    }

    @PutMapping("/{itemId}")
    @Transactional
    public ItemResponse update(@PathVariable UUID listId,
                               @PathVariable UUID itemId,
                               @CurrentDevice Device device,
                               @Valid @RequestBody UpdateItemRequest req) {
        ItemResponse item = ItemResponse.from(itemService.update(listId, itemId, device, req));
        broadcast(listId, device, "ITEM_UPDATE",
                Map.of("itemId", item.id(), "name", item.name()));
        return item;
    }

    @PatchMapping("/{itemId}/check")
    @Transactional
    public ItemResponse toggleCheck(@PathVariable UUID listId,
                                    @PathVariable UUID itemId,
                                    @CurrentDevice Device device) {
        ItemResponse item = ItemResponse.from(itemService.toggleCheck(listId, itemId, device));
        broadcast(listId, device, "ITEM_CHECK",
                Map.of("itemId", item.id(), "checked", item.checked()));
        return item;
    }

    /** Soft-delete: moves item to trash. */
    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID listId,
                       @PathVariable UUID itemId,
                       @CurrentDevice Device device) {
        itemService.delete(listId, itemId, device);
        broadcast(listId, device, "ITEM_DELETE", Map.of("itemId", itemId));
    }

    /** Restore an item from trash. */
    @PatchMapping("/{itemId}/restore")
    @Transactional
    public ItemResponse restore(@PathVariable UUID listId,
                                @PathVariable UUID itemId,
                                @CurrentDevice Device device) {
        ItemResponse item = ItemResponse.from(itemService.restore(listId, itemId, device));
        broadcast(listId, device, "ITEM_CREATE",
                Map.of("itemId", item.id(), "name", item.name(), "position", item.position()));
        return item;
    }

    /** Permanently delete a trashed item — irreversible. */
    @DeleteMapping("/{itemId}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void permanentDelete(@PathVariable UUID listId,
                                @PathVariable UUID itemId,
                                @CurrentDevice Device device) {
        itemService.permanentDelete(listId, itemId, device);
    }

    private void broadcast(UUID listId, Device device, String opType, Map<String, Object> payload) {
        Object event = Map.of(
                "id", UUID.randomUUID().toString(),
                "listId", listId.toString(),
                "deviceId", device.getId().toString(),
                "operationType", opType,
                "payload", payload,
                "vectorClock", Map.of(),
                "createdAt", Instant.now().toString()
        );
        messaging.convertAndSend("/topic/list/" + listId, event);
    }
}
