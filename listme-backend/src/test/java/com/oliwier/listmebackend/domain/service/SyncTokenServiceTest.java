package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.SyncApplyResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.model.SyncToken;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.PresetRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.domain.repository.SyncTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncTokenServiceTest {

    @Mock SyncTokenRepository syncTokenRepository;
    @Mock ShoppingListRepository listRepository;
    @Mock ListDeviceRepository listDeviceRepository;
    @Mock PresetRepository presetRepository;

    @InjectMocks SyncTokenService syncTokenService;

    Device device;
    ShoppingList list1, list2;

    @BeforeEach
    void setUp() {
        device = new Device(UUID.randomUUID());
        list1 = new ShoppingList(); list1.setId(UUID.randomUUID()); list1.setName("List 1");
        list2 = new ShoppingList(); list2.setId(UUID.randomUUID()); list2.setName("List 2");
    }

    // ── create ────────────────────────────────────────────────────────────

    @Test
    void create_generatesTokenOfCorrectLength() {
        when(listRepository.findAllByDeviceId(device.getId())).thenReturn(List.of(list1));
        when(syncTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SyncToken result = syncTokenService.create(device, "dark");

        assertThat(result.getToken()).hasSize(24).matches("[A-Za-z0-9]+");
    }

    @Test
    void create_setsExpiryAboutThirtyDaysFromNow() {
        when(listRepository.findAllByDeviceId(device.getId())).thenReturn(List.of());
        when(syncTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SyncToken result = syncTokenService.create(device, "dark");

        Instant expected = Instant.now().plus(30, ChronoUnit.DAYS);
        assertThat(result.getExpiresAt()).isAfter(expected.minus(1, ChronoUnit.MINUTES));
        assertThat(result.getExpiresAt()).isBefore(expected.plus(1, ChronoUnit.MINUTES));
    }

    @Test
    void create_groupsAllDeviceLists() {
        when(listRepository.findAllByDeviceId(device.getId())).thenReturn(List.of(list1, list2));
        when(syncTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SyncToken result = syncTokenService.create(device, "dark");

        assertThat(result.getLists()).containsExactlyInAnyOrder(list1, list2);
    }

    // ── resolve ───────────────────────────────────────────────────────────

    @Test
    void resolve_returnsToken_whenValid() {
        SyncToken token = new SyncToken();
        token.setToken("abc");
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));
        when(syncTokenRepository.findById("abc")).thenReturn(Optional.of(token));

        SyncToken result = syncTokenService.resolve("abc");
        assertThat(result).isSameAs(token);
    }

    @Test
    void resolve_throws404_whenNotFound() {
        when(syncTokenRepository.findById("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> syncTokenService.resolve("bad"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void resolve_throws410_whenExpired() {
        SyncToken expired = new SyncToken();
        expired.setToken("old");
        expired.setExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));
        when(syncTokenRepository.findById("old")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> syncTokenService.resolve("old"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("410");
    }

    // ── apply ─────────────────────────────────────────────────────────────

    @Test
    void apply_addsDeviceToAllListsInToken() {
        SyncToken token = new SyncToken();
        token.setToken("tok");
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));
        token.setCreatedByDevice(device);
        token.setLists(Set.of(list1, list2));
        when(syncTokenRepository.findById("tok")).thenReturn(Optional.of(token));
        when(listDeviceRepository.existsByListIdAndDeviceId(any(), eq(device.getId())))
                .thenReturn(false);
        when(presetRepository.findByCreatedByDeviceIdOrderByCreatedAtDesc(device.getId()))
                .thenReturn(List.of());

        SyncApplyResponse result = syncTokenService.apply("tok", device);

        assertThat(result.lists()).hasSize(2);
        verify(listDeviceRepository, times(2)).save(any());
    }

    @Test
    void apply_skipsDuplicate_whenDeviceAlreadyMember() {
        SyncToken token = new SyncToken();
        token.setToken("tok");
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));
        token.setCreatedByDevice(device);
        token.setLists(Set.of(list1));
        when(syncTokenRepository.findById("tok")).thenReturn(Optional.of(token));
        when(listDeviceRepository.existsByListIdAndDeviceId(list1.getId(), device.getId()))
                .thenReturn(true);
        when(presetRepository.findByCreatedByDeviceIdOrderByCreatedAtDesc(device.getId()))
                .thenReturn(List.of());

        syncTokenService.apply("tok", device);

        verify(listDeviceRepository, never()).save(any());
    }
}
