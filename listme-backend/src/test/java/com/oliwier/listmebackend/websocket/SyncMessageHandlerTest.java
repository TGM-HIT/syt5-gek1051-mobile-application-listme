package com.oliwier.listmebackend.websocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashMap;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncMessageHandlerTest {

    @Mock ListSyncBroadcaster broadcaster;
    @Mock PresenceTracker presenceTracker;
    @InjectMocks SyncMessageHandler handler;

    UUID listId;
    SimpMessageHeaderAccessor accessorWithDevice;
    SimpMessageHeaderAccessor accessorWithoutDevice;

    @BeforeEach
    void setUp() {
        listId = UUID.randomUUID();

        accessorWithDevice = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        var attrs = new HashMap<String, Object>();
        attrs.put(DeviceHandshakeInterceptor.DEVICE_ID_ATTR, "dev-1");
        accessorWithDevice.setSessionAttributes(attrs);

        accessorWithoutDevice = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        accessorWithoutDevice.setSessionAttributes(new HashMap<>());
    }

    // ── join ──

    @Test
    void join_withDeviceId_broadcastsJoin() {
        handler.join(listId, accessorWithDevice);
        verify(broadcaster).broadcastJoin(listId, "dev-1");
    }

    @Test
    void join_withDeviceId_storesListIdInSession() {
        handler.join(listId, accessorWithDevice);
        var attrs = accessorWithDevice.getSessionAttributes();
        assert attrs != null && attrs.containsKey("lastListId_" + listId);
    }

    @Test
    void join_withoutDeviceId_doesNotBroadcast() {
        handler.join(listId, accessorWithoutDevice);
        verifyNoInteractions(broadcaster);
    }

    @Test
    void join_nullSessionAttributes_doesNotBroadcast() {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        // sessionAttributes is null by default when not set
        handler.join(listId, accessor);
        verifyNoInteractions(broadcaster);
    }

    // ── leave ──

    @Test
    void leave_withDeviceId_broadcastsLeave() {
        handler.leave(listId, accessorWithDevice);
        verify(broadcaster).broadcastLeave(listId, "dev-1");
    }

    @Test
    void leave_withoutDeviceId_doesNotBroadcast() {
        handler.leave(listId, accessorWithoutDevice);
        verifyNoInteractions(broadcaster);
    }

    // ── onDisconnect ──

    @Test
    void onDisconnect_withDeviceId_callsDisconnectDevice() {
        // Build a minimal disconnect event whose message carries the deviceId attribute
        var msgAttrs = new HashMap<String, Object>();
        msgAttrs.put(DeviceHandshakeInterceptor.DEVICE_ID_ATTR, "dev-1");

        var headers = SimpMessageHeaderAccessor.create(SimpMessageType.DISCONNECT);
        headers.setSessionAttributes(msgAttrs);

        var rawMsg = org.springframework.messaging.support.MessageBuilder
                .withPayload(new byte[0])
                .copyHeaders(headers.toMap())
                .build();

        var event = new SessionDisconnectEvent(new Object(), rawMsg, "session-1", null);
        handler.onDisconnect(event);

        verify(presenceTracker).disconnectDevice("dev-1");
    }

    @Test
    void onDisconnect_withoutDeviceId_doesNotCallDisconnect() {
        var headers = SimpMessageHeaderAccessor.create(SimpMessageType.DISCONNECT);
        headers.setSessionAttributes(new HashMap<>());

        var rawMsg = org.springframework.messaging.support.MessageBuilder
                .withPayload(new byte[0])
                .copyHeaders(headers.toMap())
                .build();

        var event = new SessionDisconnectEvent(new Object(), rawMsg, "session-1", null);
        handler.onDisconnect(event);

        verifyNoInteractions(presenceTracker);
    }
}
