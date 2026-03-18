package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateLabelRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Label;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.LabelRepository;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
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
class LabelServiceTest {

    @Mock LabelRepository labelRepository;
    @Mock ShoppingListRepository listRepository;
    @Mock ListDeviceRepository listDeviceRepository;

    @InjectMocks LabelService labelService;

    UUID listId = UUID.randomUUID();
    UUID labelId = UUID.randomUUID();
    UUID devId  = UUID.randomUUID();

    ShoppingList list;
    Device device;
    Label label;

    @BeforeEach
    void setUp() {
        device = new Device(devId);
        list   = new ShoppingList(); list.setId(listId);
        label  = new Label();        label.setId(labelId); label.setList(list);
        label.setName("Fresh");      label.setColor("#green");
    }

    private void grantAccess() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(true);
    }

    @Test
    void getByList_returnsLabels() {
        grantAccess();
        when(labelRepository.findByListId(listId)).thenReturn(List.of(label));
        assertThat(labelService.getByList(listId, device)).containsExactly(label);
    }

    @Test
    void create_setsListAndSaves() {
        grantAccess();
        when(labelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Label result = labelService.create(listId, device, new CreateLabelRequest("Urgent", "#red"));

        assertThat(result.getName()).isEqualTo("Urgent");
        assertThat(result.getColor()).isEqualTo("#red");
        assertThat(result.getList()).isSameAs(list);
    }

    @Test
    void update_changesNameAndColor() {
        grantAccess();
        when(labelRepository.findById(labelId)).thenReturn(Optional.of(label));
        when(labelRepository.save(any())).thenReturn(label);

        Label result = labelService.update(listId, labelId, device, new CreateLabelRequest("Renamed", "#blue"));

        assertThat(result.getName()).isEqualTo("Renamed");
        assertThat(result.getColor()).isEqualTo("#blue");
    }

    @Test
    void update_throws404_whenLabelBelongsToDifferentList() {
        grantAccess();
        ShoppingList other = new ShoppingList(); other.setId(UUID.randomUUID());
        label.setList(other);
        when(labelRepository.findById(labelId)).thenReturn(Optional.of(label));

        assertThatThrownBy(() -> labelService.update(listId, labelId, device, new CreateLabelRequest("x", "#x")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void delete_callsRepositoryDelete() {
        grantAccess();
        when(labelRepository.findById(labelId)).thenReturn(Optional.of(label));

        labelService.delete(listId, labelId, device);

        verify(labelRepository).delete(label);
    }
}
