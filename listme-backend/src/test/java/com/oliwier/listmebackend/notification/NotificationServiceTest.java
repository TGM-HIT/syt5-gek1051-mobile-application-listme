package com.oliwier.listmebackend.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ListDevice;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock PushSubscriptionRepository subscriptionRepository;
    @Mock ListDeviceRepository listDeviceRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks NotificationService notificationService;

    // NOTE: @PostConstruct (init) does NOT run with @InjectMocks, so pushService
    // stays null → notify* methods return early. That behaviour is tested here too.

    Device device;
    ShoppingList list;
    Item item;

    @BeforeEach
    void setUp() {
        device = new Device();
        device.setId(UUID.randomUUID());

        list = new ShoppingList();
        list.setId(UUID.randomUUID());

        item = new Item();
        item.setName("Milch");
        item.setChecked(true);
    }

    // ── getVapidPublicKey ───────────────────────────────────────────────────

    @Test
    void getVapidPublicKey_returnsInjectedValue() {
        ReflectionTestUtils.setField(notificationService, "vapidPublicKey", "BTestKey==");
        assertThat(notificationService.getVapidPublicKey()).isEqualTo("BTestKey==");
    }

    // ── saveSubscription ────────────────────────────────────────────────────

    @Test
    void saveSubscription_createsNewWhenNoneExists() {
        when(subscriptionRepository.findByDeviceIdAndEndpoint(device.getId(), "https://ep"))
                .thenReturn(Optional.empty());

        notificationService.saveSubscription(device, "https://ep", "p256dh", "auth");

        ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
        verify(subscriptionRepository).save(captor.capture());
        PushSubscription saved = captor.getValue();
        assertThat(saved.getDevice()).isEqualTo(device);
        assertThat(saved.getEndpoint()).isEqualTo("https://ep");
        assertThat(saved.getP256dh()).isEqualTo("p256dh");
        assertThat(saved.getAuthKey()).isEqualTo("auth");
    }

    @Test
    void saveSubscription_updatesKeysWhenEndpointAlreadyExists() {
        PushSubscription existing = new PushSubscription();
        existing.setDevice(device);
        existing.setEndpoint("https://ep");
        existing.setP256dh("oldP256dh");
        existing.setAuthKey("oldAuth");

        when(subscriptionRepository.findByDeviceIdAndEndpoint(device.getId(), "https://ep"))
                .thenReturn(Optional.of(existing));

        notificationService.saveSubscription(device, "https://ep", "newP256dh", "newAuth");

        verify(subscriptionRepository).save(existing);
        assertThat(existing.getP256dh()).isEqualTo("newP256dh");
        assertThat(existing.getAuthKey()).isEqualTo("newAuth");
    }

    // ── removeSubscription ──────────────────────────────────────────────────

    @Test
    void removeSubscription_delegatesToRepository() {
        notificationService.removeSubscription(device, "https://ep");
        verify(subscriptionRepository).deleteByDeviceIdAndEndpoint(device.getId(), "https://ep");
    }

    // ── notify* — pushService is null (not initialised in unit-test context) ─

    @Test
    void notifyItemChecked_doesNothingWhenPushServiceIsNull() {
        // pushService == null because @PostConstruct did not run
        notificationService.notifyItemChecked(list, item, device);
        verifyNoInteractions(listDeviceRepository, subscriptionRepository);
    }

    @Test
    void notifyItemDeleted_doesNothingWhenPushServiceIsNull() {
        notificationService.notifyItemDeleted(list, item, device);
        verifyNoInteractions(listDeviceRepository, subscriptionRepository);
    }

    // ── sendToListDevices — skips the triggering device ────────────────────
    // We inject a non-null pushService via reflection to exercise the send path.

    @Test
    void notifyItemChecked_skipsTheTriggeringDevice() throws Exception {
        // Inject a sentinel non-null object so the early-return guard passes,
        // but subscriptionRepository returns empty so no actual send occurs.
        Object fakePushService = new Object();
        ReflectionTestUtils.setField(notificationService, "pushService", fakePushService);

        Device other = new Device();
        other.setId(UUID.randomUUID());

        ListDevice ldOther = new ListDevice();
        ldOther.setDevice(other);

        ListDevice ldTrigger = new ListDevice();
        ldTrigger.setDevice(device);

        when(listDeviceRepository.findByListId(list.getId())).thenReturn(List.of(ldTrigger, ldOther));
        when(subscriptionRepository.findByDeviceId(other.getId())).thenReturn(List.of());

        notificationService.notifyItemChecked(list, item, device);

        // Only the other device was queried for subscriptions, not the trigger device
        verify(subscriptionRepository, never()).findByDeviceId(device.getId());
        verify(subscriptionRepository).findByDeviceId(other.getId());
    }
}
