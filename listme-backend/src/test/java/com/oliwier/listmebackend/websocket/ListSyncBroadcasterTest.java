package com.oliwier.listmebackend.websocket;

import com.oliwier.listmebackend.api.dto.CrdtOperationResponse;
import com.oliwier.listmebackend.domain.model.CrdtOperation;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListSyncBroadcasterTest {

    @Mock SimpMessagingTemplate messaging;
    @Mock PresenceTracker presenceTracker;
    @InjectMocks ListSyncBroadcaster broadcaster;

    private CrdtOperation buildOp(UUID listId) {
        ShoppingList list = mock(ShoppingList.class);
        when(list.getId()).thenReturn(listId);

        Device device = mock(Device.class);
        when(device.getId()).thenReturn(UUID.randomUUID());

        CrdtOperation op = new CrdtOperation();
        op.setId(UUID.randomUUID());
        op.setList(list);
        op.setDevice(device);
        op.setOperationType("ITEM_ADD");
        op.setPayload(Map.of());
        op.setVectorClock(Map.of());
        op.setCreatedAt(java.time.Instant.now());
        return op;
    }

    @Test
    void broadcastOp_sendsToCorrectTopic() {
        UUID listId = UUID.randomUUID();
        broadcaster.broadcastOp(listId, buildOp(listId));
        verify(messaging).convertAndSend(eq("/topic/list/" + listId), any(CrdtOperationResponse.class));
    }

    @Test
    void broadcastJoin_callsPresenceTrackerJoin() {
        UUID listId = UUID.randomUUID();
        when(presenceTracker.getOnlineDevices(listId)).thenReturn(Set.of("dev-1"));

        broadcaster.broadcastJoin(listId, "dev-1");

        verify(presenceTracker).join(listId, "dev-1");
    }

    @Test
    void broadcastJoin_sendsJoinedPresenceMessage() {
        UUID listId = UUID.randomUUID();
        when(presenceTracker.getOnlineDevices(listId)).thenReturn(Set.of("dev-1"));

        broadcaster.broadcastJoin(listId, "dev-1");

        ArgumentCaptor<PresenceMessage> captor = ArgumentCaptor.forClass(PresenceMessage.class);
        verify(messaging).convertAndSend(eq("/topic/list/" + listId + "/presence"), captor.capture());
        assertThat(captor.getValue().event()).isEqualTo("joined");
        assertThat(captor.getValue().deviceId()).isEqualTo("dev-1");
        assertThat(captor.getValue().onlineDevices()).contains("dev-1");
    }

    @Test
    void broadcastLeave_callsPresenceTrackerLeave() {
        UUID listId = UUID.randomUUID();
        when(presenceTracker.getOnlineDevices(listId)).thenReturn(Set.of());

        broadcaster.broadcastLeave(listId, "dev-1");

        verify(presenceTracker).leave(listId, "dev-1");
    }

    @Test
    void broadcastLeave_sendsLeftPresenceMessage() {
        UUID listId = UUID.randomUUID();
        when(presenceTracker.getOnlineDevices(listId)).thenReturn(Set.of());

        broadcaster.broadcastLeave(listId, "dev-1");

        ArgumentCaptor<PresenceMessage> captor = ArgumentCaptor.forClass(PresenceMessage.class);
        verify(messaging).convertAndSend(eq("/topic/list/" + listId + "/presence"), captor.capture());
        assertThat(captor.getValue().event()).isEqualTo("left");
        assertThat(captor.getValue().deviceId()).isEqualTo("dev-1");
    }

    @Test
    void sendSnapshot_sendsSnapshotPresenceMessage() {
        UUID listId = UUID.randomUUID();
        when(presenceTracker.getOnlineDevices(listId)).thenReturn(Set.of("dev-1", "dev-2"));

        broadcaster.sendSnapshot(listId, "dev-1");

        ArgumentCaptor<PresenceMessage> captor = ArgumentCaptor.forClass(PresenceMessage.class);
        verify(messaging).convertAndSend(eq("/topic/list/" + listId + "/presence"), captor.capture());
        assertThat(captor.getValue().event()).isEqualTo("snapshot");
        assertThat(captor.getValue().onlineDevices()).containsExactlyInAnyOrder("dev-1", "dev-2");
    }
}
