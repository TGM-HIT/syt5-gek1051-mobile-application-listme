package com.oliwier.listmebackend.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;
import org.bouncycastle.util.BigIntegers;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.*;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${vapid.subject:mailto:admin@listme.app}")
    private String vapidSubject;

    private final PushSubscriptionRepository subscriptionRepository;
    private final ListDeviceRepository listDeviceRepository;
    private final ObjectMapper objectMapper;

    private PushService pushService;

    @PostConstruct
    public void init() {
        try {
            Security.addProvider(new BouncyCastleProvider());
        } catch (Exception ignored) {
            // provider may already be registered
        }

        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            log.warn("=======================================================");
            log.warn("  VAPID keys not set — generating temporary keys.");
            log.warn("  Add these to application.properties to persist them:");
            try {
                ECNamedCurveParameterSpec spec = ECNamedCurveTable.getParameterSpec("prime256v1");
                KeyPairGenerator gen = KeyPairGenerator.getInstance("ECDH", "BC");
                gen.initialize(spec, new SecureRandom());
                KeyPair kp = gen.generateKeyPair();

                org.bouncycastle.jce.interfaces.ECPublicKey pub =
                        (org.bouncycastle.jce.interfaces.ECPublicKey) kp.getPublic();
                org.bouncycastle.jce.interfaces.ECPrivateKey priv =
                        (org.bouncycastle.jce.interfaces.ECPrivateKey) kp.getPrivate();

                byte[] pubBytes = pub.getQ().getEncoded(false);
                byte[] privBytes = BigIntegers.asUnsignedByteArray(32, priv.getD());

                Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
                vapidPublicKey = enc.encodeToString(pubBytes);
                vapidPrivateKey = enc.encodeToString(privBytes);

                log.warn("  vapid.public-key={}", vapidPublicKey);
                log.warn("  vapid.private-key={}", vapidPrivateKey);
                log.warn("=======================================================");
            } catch (Exception e) {
                log.error("Failed to generate VAPID keys — push notifications disabled", e);
                return;
            }
        }

        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("Push notification service initialized");
        } catch (Exception e) {
            log.error("Failed to initialize PushService — push notifications disabled", e);
        }
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    @Async
    public void notifyItemChecked(ShoppingList list, Item item, Device triggerDevice) {
        if (pushService == null) return;
        String title = item.isChecked() ? "Abgehakt ✓" : "Wieder offen";
        String body = item.isChecked()
                ? item.getName() + " wurde gekauft"
                : item.getName() + " ist wieder offen";
        sendToListDevices(list, triggerDevice, title, body);
    }

    @Async
    public void notifyItemDeleted(ShoppingList list, Item item, Device triggerDevice) {
        if (pushService == null) return;
        sendToListDevices(list, triggerDevice,
                "Artikel entfernt",
                item.getName() + " wurde aus der Liste entfernt");
    }

    private void sendToListDevices(ShoppingList list, Device except, String title, String body) {
        List<UUID> deviceIds = listDeviceRepository.findByListId(list.getId())
                .stream()
                .map(ld -> ld.getDevice().getId())
                .filter(id -> !id.equals(except.getId()))
                .toList();

        for (UUID deviceId : deviceIds) {
            for (PushSubscription sub : subscriptionRepository.findByDeviceId(deviceId)) {
                send(sub, title, body, list.getId());
            }
        }
    }

    private void send(PushSubscription sub, String title, String body, UUID listId) {
        try {
            byte[] payload = objectMapper.writeValueAsBytes(Map.of(
                    "title", title,
                    "body", body,
                    "listId", listId.toString(),
                    "url", "/list/" + listId
            ));
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuthKey(),
                    payload
            );
            pushService.send(notification);
        } catch (Exception e) {
            log.warn("Push failed for endpoint {}: {}", sub.getEndpoint(), e.getMessage());
        }
    }

    @Transactional
    public void saveSubscription(Device device, String endpoint, String p256dh, String auth) {
        subscriptionRepository.findByDeviceIdAndEndpoint(device.getId(), endpoint)
                .ifPresentOrElse(
                        existing -> {
                            existing.setP256dh(p256dh);
                            existing.setAuthKey(auth);
                            subscriptionRepository.save(existing);
                        },
                        () -> {
                            PushSubscription sub = new PushSubscription();
                            sub.setDevice(device);
                            sub.setEndpoint(endpoint);
                            sub.setP256dh(p256dh);
                            sub.setAuthKey(auth);
                            subscriptionRepository.save(sub);
                        }
                );
    }

    @Transactional
    public void removeSubscription(Device device, String endpoint) {
        subscriptionRepository.deleteByDeviceIdAndEndpoint(device.getId(), endpoint);
    }
}
