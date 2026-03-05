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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/items")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemController {

    private final ItemService itemService;

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
        return ItemResponse.from(itemService.create(listId, device, req));
    }

    @PutMapping("/{itemId}")
    @Transactional
    public ItemResponse update(@PathVariable UUID listId,
                               @PathVariable UUID itemId,
                               @CurrentDevice Device device,
                               @Valid @RequestBody UpdateItemRequest req) {
        return ItemResponse.from(itemService.update(listId, itemId, device, req));
    }

    @PatchMapping("/{itemId}/check")
    @Transactional
    public ItemResponse toggleCheck(@PathVariable UUID listId,
                                    @PathVariable UUID itemId,
                                    @CurrentDevice Device device) {
        return ItemResponse.from(itemService.toggleCheck(listId, itemId, device));
    }

    /** Soft-delete: moves item to trash. */
    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID listId,
                       @PathVariable UUID itemId,
                       @CurrentDevice Device device) {
        itemService.delete(listId, itemId, device);
    }

    /** Restore an item from trash. */
    @PatchMapping("/{itemId}/restore")
    @Transactional
    public ItemResponse restore(@PathVariable UUID listId,
                                @PathVariable UUID itemId,
                                @CurrentDevice Device device) {
        return ItemResponse.from(itemService.restore(listId, itemId, device));
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
}


