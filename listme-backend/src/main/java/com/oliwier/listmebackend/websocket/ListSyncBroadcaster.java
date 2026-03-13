package com.oliwier.listmebackend.websocket;

import com.oliwier.listmebackend.api.dto.CrdtOperationResponse;
import com.oliwier.listmebackend.domain.model.CrdtOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Broadcasts CRDT operations and presence events to WebSocket subscribers.
 *
 * Topic layout:
 *   /topic/list/{listId}          — CrdtOperationResponse (item changes)
 *   /topic/list/{listId}/presence — PresenceMessage (join/leave/snapshot)
 */
@Component
@RequiredArgsConstructor
public class ListSyncBroadcaster {

    private final SimpMessagingTemplate messaging;
    private final PresenceTracker presenceTracker;

    public void broadcastOp(UUID listId, CrdtOperation op) {
        messaging.convertAndSend(
                "/topic/list/" + listId,
                CrdtOperationResponse.from(op)
        );
    }

    public void broadcastJoin(UUID listId, String deviceId) {
        presenceTracker.join(listId, deviceId);
        messaging.convertAndSend(
                "/topic/list/" + listId + "/presence",
                new PresenceMessage("joined", deviceId, presenceTracker.getOnlineDevices(listId))
        );
    }

    public void broadcastLeave(UUID listId, String deviceId) {
        presenceTracker.leave(listId, deviceId);
        messaging.convertAndSend(
                "/topic/list/" + listId + "/presence",
                new PresenceMessage("left", deviceId, presenceTracker.getOnlineDevices(listId))
        );
    }

    public void sendSnapshot(UUID listId, String deviceId) {
        messaging.convertAndSend(
                "/topic/list/" + listId + "/presence",
                new PresenceMessage("snapshot", deviceId, presenceTracker.getOnlineDevices(listId))
        );
    }
}
