package com.oliwier.listmebackend.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.UUID;

/**
 * Handles client-initiated STOMP messages.
 *
 * /app/list/{listId}/join  — client announces it's viewing a list
 * /app/list/{listId}/leave — client announces it's leaving a list
 */
@Controller
@RequiredArgsConstructor
public class SyncMessageHandler {

    private final ListSyncBroadcaster broadcaster;
    private final PresenceTracker presenceTracker;

    @MessageMapping("/list/{listId}/join")
    public void join(@DestinationVariable UUID listId, SimpMessageHeaderAccessor accessor) {
        String deviceId = deviceId(accessor);
        if (deviceId == null) return;

        accessor.getSessionAttributes().put("lastListId_" + listId, listId.toString());

        broadcaster.broadcastJoin(listId, deviceId);
    }

    @MessageMapping("/list/{listId}/leave")
    public void leave(@DestinationVariable UUID listId, SimpMessageHeaderAccessor accessor) {
        String deviceId = deviceId(accessor);
        if (deviceId == null) return;
        broadcaster.broadcastLeave(listId, deviceId);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor accessor =
                SimpMessageHeaderAccessor.wrap(event.getMessage());
        String deviceId = deviceId(accessor);
        if (deviceId == null) return;

        presenceTracker.disconnectDevice(deviceId);
    }

    private String deviceId(SimpMessageHeaderAccessor accessor) {
        if (accessor.getSessionAttributes() == null) return null;
        return (String) accessor.getSessionAttributes()
                .get(DeviceHandshakeInterceptor.DEVICE_ID_ATTR);
    }
}
