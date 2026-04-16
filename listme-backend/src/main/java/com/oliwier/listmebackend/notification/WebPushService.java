package com.oliwier.listmebackend.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oliwier.listmebackend.domain.model.PushSubscriptionEntry;
import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.model.VapidKey;
import com.oliwier.listmebackend.domain.repository.PushSubscriptionRepository;
import com.oliwier.listmebackend.domain.repository.VapidKeyRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.*;

/**
 * Manages VAPID key pair lifecycle and sends Web Push notifications.
 *
 * Keys are stored in X509/PKCS8 format (what the web-push library requires).
 * The browser-friendly public key (raw 65-byte EC point) is derived on the fly.
 *
 * @PostConstruct does NOT carry @Transactional — JpaRepository methods are
 * already transactional internally, and mixing @Transactional + @PostConstruct
 * is unreliable in Spring Boot.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository subRepo;
    private final VapidKeyRepository vapidRepo;
    private final ObjectMapper objectMapper;

    private PushService pushService;
    // Stored in X509 format for the library; served as raw EC point to the browser
    private String vapidPublicKeyX509;

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            VapidKey keys = vapidRepo.findById((short) 1).orElseGet(this::generateAndSaveKeys);

            vapidPublicKeyX509 = keys.getPublicKey();
            pushService = new PushService(keys.getPublicKey(), keys.getPrivateKey());
            pushService.setSubject("mailto:admin@list-me.net");
            log.info("[WebPush] Initialized with existing VAPID keys");
        } catch (Exception e) {
            log.error("[WebPush] Failed to initialize — push notifications disabled", e);
            // Don't rethrow: a push failure must never crash the application context
        }
    }

    /**
     * Returns the VAPID public key in raw uncompressed EC point format (65 bytes, base64url).
     * This is what the browser passes to PushManager.subscribe() as applicationServerKey.
     */
    public String getBrowserPublicKey() {
        if (vapidPublicKeyX509 == null) return "";
        // X509 SubjectPublicKeyInfo for P-256 = 26-byte header + 65-byte EC point
        byte[] x509Bytes = Base64.getUrlDecoder().decode(vapidPublicKeyX509);
        byte[] rawPoint = Arrays.copyOfRange(x509Bytes, x509Bytes.length - 65, x509Bytes.length);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawPoint);
    }

    @Transactional
    public void subscribe(User user, String endpoint, String p256dh, String auth) {
        subRepo.findByEndpoint(endpoint).ifPresentOrElse(
            existing -> {},
            () -> {
                PushSubscriptionEntry sub = new PushSubscriptionEntry();
                sub.setUser(user);
                sub.setEndpoint(endpoint);
                sub.setP256dh(p256dh);
                sub.setAuthKey(auth);
                subRepo.save(sub);
            }
        );
    }

    @Transactional
    public void unsubscribe(String endpoint) {
        subRepo.deleteByEndpoint(endpoint);
    }

    public void sendToUser(UUID userId, String title, String body, String url) {
        if (pushService == null) return;
        List<PushSubscriptionEntry> subs = subRepo.findByUserId(userId);
        for (PushSubscriptionEntry sub : subs) {
            try {
                Map<String, String> payload = Map.of("title", title, "body", body, "url", url);
                byte[] payloadBytes = objectMapper.writeValueAsBytes(payload);
                Notification notification = new Notification(
                        sub.getEndpoint(), sub.getP256dh(), sub.getAuthKey(), payloadBytes);
                pushService.send(notification);
            } catch (Exception e) {
                String msg = e.getMessage();
                if (msg != null && (msg.contains("410") || msg.contains("404"))) {
                    subRepo.delete(sub);
                } else {
                    log.warn("[WebPush] Failed to send push to {}: {}", sub.getEndpoint(), msg);
                }
            }
        }
    }

    private VapidKey generateAndSaveKeys() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", "BC");
            kpg.initialize(new ECGenParameterSpec("prime256v1"));
            var kp = kpg.generateKeyPair();

            // Store in X509 / PKCS8 format — what PushService(String, String) expects
            String pubX509 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(kp.getPublic().getEncoded());
            String privPkcs8 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(kp.getPrivate().getEncoded());

            VapidKey k = new VapidKey();
            k.setId((short) 1);
            k.setPublicKey(pubX509);
            k.setPrivateKey(privPkcs8);
            log.info("[WebPush] Generated new VAPID key pair");
            return vapidRepo.save(k);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate VAPID keys", e);
        }
    }
}
