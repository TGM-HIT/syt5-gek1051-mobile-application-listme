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
import org.bouncycastle.jce.interfaces.ECPrivateKey;
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
 * Keys are stored as raw base64url:
 *   public key  = uncompressed EC point (65 bytes, 0x04 prefix)
 *   private key = raw scalar (32 bytes)
 * Both formats are what PushService(String, String) and the browser expect directly.
 *
 * @PostConstruct does NOT carry @Transactional — JpaRepository methods are
 * already transactional internally.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final PushSubscriptionRepository subRepo;
    private final VapidKeyRepository vapidRepo;

    private PushService pushService;
    private String vapidPublicKey; // raw EC point, base64url — served directly to browser

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            VapidKey keys = vapidRepo.findById((short) 1).orElseGet(this::generateAndSaveKeys);

            // Detect stale X509-format key (DER SEQUENCE starts with 0x30) and regenerate
            byte[] pubBytes = Base64.getUrlDecoder().decode(keys.getPublicKey());
            if (pubBytes[0] == 0x30) {
                log.info("[WebPush] Stale X509 key detected — regenerating");
                vapidRepo.deleteById((short) 1);
                keys = generateAndSaveKeys();
            }

            vapidPublicKey = keys.getPublicKey();
            pushService = new PushService(keys.getPublicKey(), keys.getPrivateKey());
            pushService.setSubject("mailto:admin@list-me.net");
            log.info("[WebPush] Initialized VAPID keys");
        } catch (Exception e) {
            log.error("[WebPush] Failed to initialize — push notifications disabled", e);
        }
    }

    /** Raw uncompressed EC point (base64url, no padding) — pass directly as applicationServerKey. */
    public String getBrowserPublicKey() {
        return vapidPublicKey != null ? vapidPublicKey : "";
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
                byte[] payloadBytes = MAPPER.writeValueAsBytes(payload);
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

            // Public key: strip the 26-byte X509 header, keep the 65-byte raw EC point
            byte[] x509Pub = kp.getPublic().getEncoded();
            byte[] rawPub = Arrays.copyOfRange(x509Pub, x509Pub.length - 65, x509Pub.length);

            // Private key: extract the raw 32-byte scalar via BouncyCastle interface
            ECPrivateKey bcPriv = (ECPrivateKey) kp.getPrivate();
            byte[] dBytes = bcPriv.getD().toByteArray();
            // BigInteger.toByteArray() adds a leading 0x00 sign byte when the high bit is set
            if (dBytes.length == 33 && dBytes[0] == 0) {
                dBytes = Arrays.copyOfRange(dBytes, 1, 33);
            }

            VapidKey k = new VapidKey();
            k.setId((short) 1);
            k.setPublicKey(Base64.getUrlEncoder().withoutPadding().encodeToString(rawPub));
            k.setPrivateKey(Base64.getUrlEncoder().withoutPadding().encodeToString(dBytes));
            log.info("[WebPush] Generated new VAPID key pair");
            return vapidRepo.save(k);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate VAPID keys", e);
        }
    }
}
