package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CrdtOperationResponse;
import com.oliwier.listmebackend.crdt.IncomingOperation;
import com.oliwier.listmebackend.crdt.SyncEngine;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.identity.CurrentDevice;
import com.oliwier.listmebackend.identity.CurrentUser;
import com.oliwier.listmebackend.websocket.ListSyncBroadcaster;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CRDT sync endpoints.
 *
 * GET  /api/lists/{listId}/crdt/clock          → current server vector clock for a list
 * GET  /api/lists/{listId}/crdt/ops            → ops the client hasn't seen yet (since given clock)
 * POST /api/lists/{listId}/crdt/ops            → push ops from client to server
 */
@RestController
@RequestMapping("/api/lists/{listId}/crdt")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncController {

    private final SyncEngine syncEngine;
    private final ListDeviceRepository listDeviceRepository;
    private final ShoppingListRepository listRepository;
    private final ListSyncBroadcaster broadcaster;
    private final SimpMessagingTemplate messaging;

    @GetMapping("/clock")
    public Map<String, Long> getClock(@PathVariable UUID listId, @CurrentDevice Device device) {
        requireAccess(listId, device);
        return syncEngine.getCurrentClock(listId);
    }

    @GetMapping("/ops")
    public List<CrdtOperationResponse> getOps(
            @PathVariable UUID listId,
            @CurrentDevice Device device,
            @RequestParam(required = false) Map<String, Long> since) {
        requireAccess(listId, device);
        Map<String, Long> clientClock = since != null ? since : Map.of();
        return syncEngine.getOperationsSince(listId, clientClock)
                .stream()
                .map(CrdtOperationResponse::from)
                .toList();
    }

    @PostMapping("/ops")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void pushOps(
            @PathVariable UUID listId,
            @CurrentDevice Device device,
            @CurrentUser User user,
            @RequestBody List<IncomingOperation> ops) {
        requireAccess(listId, device);
        SyncEngine.SyncResult result = syncEngine.applyIncoming(ops, device);
        result.applied().forEach(op -> broadcaster.broadcastOp(listId, op));

        if (!result.conflicts().isEmpty()) {
            ShoppingList list = listRepository.findById(listId).orElse(null);
            String listName = list != null ? list.getName() : "";
            Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("type", "CONFLICT_DETECTED");
            notification.put("listId", listId.toString());
            notification.put("listName", listName);
            notification.put("conflictCount", result.conflicts().size());
            messaging.convertAndSend("/topic/user/" + user.getId(), (Object) notification);
        }
    }

    private void requireAccess(UUID listId, Device device) {
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }
    }
}
