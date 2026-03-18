package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresetServiceTest {

    @Mock PresetRepository presetRepository;
    @Mock PresetItemRepository presetItemRepository;
    @Mock ShoppingListRepository listRepository;
    @Mock ItemRepository itemRepository;
    @Mock ListDeviceRepository listDeviceRepository;

    @InjectMocks PresetService presetService;

    UUID devId    = UUID.randomUUID();
    UUID listId   = UUID.randomUUID();
    UUID presetId = UUID.randomUUID();

    Device device;
    ShoppingList list;

    @BeforeEach
    void setUp() {
        device = new Device(devId);
        list   = new ShoppingList(); list.setId(listId); list.setName("Weekly"); list.setEmoji("🛒");
    }

    private Item item(String name) {
        Item i = new Item(); i.setId(UUID.randomUUID()); i.setName(name); i.setList(list);
        return i;
    }

    // ── createFromList ────────────────────────────────────────────────────

    @Test
    void createFromList_throwsForbidden_whenNotParticipant() {
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(false);

        assertThatThrownBy(() -> presetService.createFromList(device, listId, "My Preset", null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void createFromList_copiesItemsFromList() {
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(true);
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(item("Milk"), item("Eggs")));
        when(presetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Preset result = presetService.createFromList(device, listId, "Grocery", null);

        assertThat(result.getName()).isEqualTo("Grocery");
        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getItems().get(0).getName()).isEqualTo("Milk");
        assertThat(result.getItems().get(1).getPosition()).isEqualTo(1);
    }

    @Test
    void createFromList_usesListEmojiWhenNoneProvided() {
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(true);
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId)).thenReturn(List.of());
        when(presetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Preset result = presetService.createFromList(device, listId, "Preset", null);

        assertThat(result.getEmoji()).isEqualTo("🛒");
    }

    @Test
    void createFromList_usesProvidedEmoji_whenGiven() {
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(true);
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId)).thenReturn(List.of());
        when(presetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Preset result = presetService.createFromList(device, listId, "Preset", "🏪");

        assertThat(result.getEmoji()).isEqualTo("🏪");
    }

    // ── delete ────────────────────────────────────────────────────────────

    @Test
    void delete_removesOwnPreset() {
        Preset p = new Preset(); p.setId(presetId); p.setCreatedByDevice(device);
        when(presetRepository.findById(presetId)).thenReturn(Optional.of(p));

        presetService.delete(device, presetId);

        verify(presetRepository).delete(p);
    }

    @Test
    void delete_throwsForbidden_whenNotOwner() {
        Device other = new Device(UUID.randomUUID());
        Preset p = new Preset(); p.setId(presetId); p.setCreatedByDevice(other);
        when(presetRepository.findById(presetId)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> presetService.delete(device, presetId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void delete_throws404_whenPresetNotFound() {
        when(presetRepository.findById(presetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> presetService.delete(device, presetId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
