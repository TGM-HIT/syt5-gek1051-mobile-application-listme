package com.oliwier.listmebackend.websocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PresenceTrackerTest {

    PresenceTracker tracker;

    @BeforeEach
    void setUp() {
        tracker = new PresenceTracker();
    }

    @Test
    void join_addsDeviceToList() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        assertThat(tracker.getOnlineDevices(listId)).containsExactly("dev-1");
    }

    @Test
    void join_multipleDevicesToSameList() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        tracker.join(listId, "dev-2");
        assertThat(tracker.getOnlineDevices(listId)).containsExactlyInAnyOrder("dev-1", "dev-2");
    }

    @Test
    void join_idempotent_sameDeviceTwice() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        tracker.join(listId, "dev-1");
        assertThat(tracker.getOnlineDevices(listId)).hasSize(1);
    }

    @Test
    void leave_removesDevice() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        tracker.join(listId, "dev-2");
        tracker.leave(listId, "dev-1");
        assertThat(tracker.getOnlineDevices(listId)).containsExactly("dev-2");
    }

    @Test
    void leave_removesListEntryWhenEmpty() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        tracker.leave(listId, "dev-1");
        // After the last device leaves the list entry should be cleaned up
        assertThat(tracker.getOnlineDevices(listId)).isEmpty();
    }

    @Test
    void leave_unknownListIsNoop() {
        UUID listId = UUID.randomUUID();
        // Should not throw
        tracker.leave(listId, "dev-1");
        assertThat(tracker.getOnlineDevices(listId)).isEmpty();
    }

    @Test
    void disconnectDevice_removesFromAllLists() {
        UUID list1 = UUID.randomUUID();
        UUID list2 = UUID.randomUUID();
        tracker.join(list1, "dev-1");
        tracker.join(list2, "dev-1");
        tracker.join(list1, "dev-2");

        tracker.disconnectDevice("dev-1");

        assertThat(tracker.getOnlineDevices(list1)).containsExactly("dev-2");
        assertThat(tracker.getOnlineDevices(list2)).isEmpty();
    }

    @Test
    void disconnectDevice_unknownDeviceIsNoop() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        tracker.disconnectDevice("dev-unknown");
        assertThat(tracker.getOnlineDevices(listId)).containsExactly("dev-1");
    }

    @Test
    void getOnlineDevices_unknownListReturnsEmptySet() {
        assertThat(tracker.getOnlineDevices(UUID.randomUUID())).isEmpty();
    }

    @Test
    void getOnlineDevices_returnsUnmodifiableSet() {
        UUID listId = UUID.randomUUID();
        tracker.join(listId, "dev-1");
        var devices = tracker.getOnlineDevices(listId);
        assertThatThrownBy(() -> devices.add("dev-x"))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void join_differentLists_independentTracking() {
        UUID list1 = UUID.randomUUID();
        UUID list2 = UUID.randomUUID();
        tracker.join(list1, "dev-1");
        tracker.join(list2, "dev-2");
        assertThat(tracker.getOnlineDevices(list1)).containsExactly("dev-1");
        assertThat(tracker.getOnlineDevices(list2)).containsExactly("dev-2");
    }
}
