package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShareServiceTest {

    @Mock ShoppingListRepository listRepository;
    @Mock ListDeviceRepository listDeviceRepository;

    @InjectMocks ShareService shareService;

    ShoppingList list;
    Device device;

    @BeforeEach
    void setUp() {
        list = new ShoppingList();
        list.setId(UUID.randomUUID());
        device = new Device(UUID.randomUUID());
    }

    // ── generateShareToken ─────────────────────────────────────────────────

    @Test
    void generateShareToken_createsNewToken_whenNoneExists() {
        when(listRepository.save(any())).thenReturn(list);

        String token = shareService.generateShareToken(list);

        assertThat(token).isNotBlank().hasSize(12);
        verify(listRepository).save(list);
    }

    @Test
    void generateShareToken_returnsExistingToken_whenAlreadySet() {
        list.setShareToken("existingToken");

        String token = shareService.generateShareToken(list);

        assertThat(token).isEqualTo("existingToken");
        verify(listRepository, never()).save(any());
    }

    @Test
    void generateShareToken_isAlphanumeric() {
        when(listRepository.save(any())).thenReturn(list);

        String token = shareService.generateShareToken(list);

        assertThat(token).matches("[A-Za-z0-9]+");
    }

    // ── revokeShareToken ───────────────────────────────────────────────────

    @Test
    void revokeShareToken_clearsToken() {
        list.setShareToken("someToken");
        when(listRepository.save(any())).thenReturn(list);

        shareService.revokeShareToken(list);

        assertThat(list.getShareToken()).isNull();
    }

    // ── findByShareToken ───────────────────────────────────────────────────

    @Test
    void findByShareToken_returnsList_whenTokenValid() {
        when(listRepository.findByShareToken("abc")).thenReturn(Optional.of(list));

        ShoppingList result = shareService.findByShareToken("abc");

        assertThat(result).isSameAs(list);
    }

    @Test
    void findByShareToken_throws404_whenTokenInvalid() {
        when(listRepository.findByShareToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareService.findByShareToken("bad"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    // ── joinViaShareToken ──────────────────────────────────────────────────

    @Test
    void joinViaShareToken_addsDeviceAsParticipant_whenNotAlreadyMember() {
        when(listRepository.findByShareToken("tok")).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(list.getId(), device.getId()))
                .thenReturn(false);
        when(listRepository.save(any())).thenReturn(list);

        ShoppingList result = shareService.joinViaShareToken("tok", device);

        assertThat(result).isSameAs(list);
        assertThat(list.getListDevices()).hasSize(1);
    }

    @Test
    void joinViaShareToken_doesNotDuplicate_whenAlreadyMember() {
        when(listRepository.findByShareToken("tok")).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(list.getId(), device.getId()))
                .thenReturn(true);

        shareService.joinViaShareToken("tok", device);

        assertThat(list.getListDevices()).isEmpty();
        verify(listRepository, never()).save(any());
    }
}
