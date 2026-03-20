package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateItemRequest;
import com.oliwier.listmebackend.crdt.SyncEngine;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.*;
import com.oliwier.listmebackend.notification.NotificationService;
import com.oliwier.listmebackend.websocket.ListSyncBroadcaster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock ItemRepository itemRepository;
    @Mock ShoppingListRepository listRepository;
    @Mock ListDeviceRepository listDeviceRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock LabelRepository labelRepository;
    @Mock SyncEngine syncEngine;
    @Mock ListSyncBroadcaster broadcaster;
    @Mock NotificationService notificationService;

    @InjectMocks ItemService itemService;

    UUID listId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();
    UUID deviceId = UUID.randomUUID();

    Device device;
    ShoppingList list;
    Item item;

    @BeforeEach
    void setUp() {
        device = new Device(deviceId);
        list = new ShoppingList();
        list.setId(listId);
        item = new Item();
        item.setId(itemId);
        item.setList(list);
        item.setName("Milk");
        item.setChecked(false);
    }

    // ── requireAccess ─────────────────────────────────────────────────────

    @Test
    void getByList_throwsNotFound_whenListMissing() {
        when(listRepository.findById(listId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> itemService.getByList(listId, device, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void getByList_throwsForbidden_whenDeviceNotParticipant() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(false);
        assertThatThrownBy(() -> itemService.getByList(listId, device, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void getByList_returnsItems_whenAccessGranted() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(item));

        List<Item> result = itemService.getByList(listId, device, null);
        assertThat(result).containsExactly(item);
    }

    // ── create ────────────────────────────────────────────────────────────

    @Test
    void create_savesItemAndRecordsCrdtOp() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.countByListIdAndDeletedAtIsNull(listId)).thenReturn(0);
        when(itemRepository.save(any())).thenAnswer(inv -> {
            Item i = inv.getArgument(0);
            i.setId(UUID.randomUUID());
            return i;
        });
        when(syncEngine.record(any(), any(), any(), any())).thenReturn(null);

        var req = new CreateItemRequest("Milk", null, null, null, null, null, null);
        Item result = itemService.create(listId, device, req);

        assertThat(result.getName()).isEqualTo("Milk");
        verify(syncEngine).record(eq(list), eq(device), any(), any());
        verify(broadcaster).broadcastOp(any(), any());
    }

    // ── toggleCheck ───────────────────────────────────────────────────────

    @Test
    void toggleCheck_flipsCheckedStateAndBroadcasts() {
        item.setChecked(false);
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenReturn(item);
        when(syncEngine.record(any(), any(), any(), any())).thenReturn(null);

        Item result = itemService.toggleCheck(listId, itemId, device);

        assertThat(result.isChecked()).isTrue();
        verify(broadcaster).broadcastOp(any(), any());
    }

    @Test
    void toggleCheck_throwsGone_whenItemInTrash() {
        item.setDeletedAt(Instant.now());
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> itemService.toggleCheck(listId, itemId, device))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("410");
    }

    // ── delete (soft) ─────────────────────────────────────────────────────

    @Test
    void delete_setsDeletedAt() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenReturn(item);
        when(syncEngine.record(any(), any(), any(), any())).thenReturn(null);

        itemService.delete(listId, itemId, device);

        assertThat(item.getDeletedAt()).isNotNull();
    }

    // ── restore ───────────────────────────────────────────────────────────

    @Test
    void restore_clearsDeletedAt() {
        item.setDeletedAt(Instant.now());
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenReturn(item);

        Item result = itemService.restore(listId, itemId, device);

        assertThat(result.getDeletedAt()).isNull();
    }

    @Test
    void restore_throwsNotFound_whenItemBelongsToDifferentList() {
        ShoppingList other = new ShoppingList();
        other.setId(UUID.randomUUID());
        item.setList(other);
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, deviceId)).thenReturn(true);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> itemService.restore(listId, itemId, device))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
