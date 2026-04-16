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

import java.math.BigInteger;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository subRepo;
    private final VapidKeyRepository vapidRepo;
    private final ObjectMapper objectMapper;

    private PushService pushService;
    private String vapidPublicKey;

    @PostConstruct
    @Transactional
    public void init() {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        VapidKey keys = vapidRepo.findById((short) 1).orElseGet(() -> {
            try {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", "BC");
                kpg.initialize(new ECGenParameterSpec("prime256v1"));
                var kp = kpg.generateKeyPair();

                ECPublicKey pub = (ECPublicKey) kp.getPublic();
                byte[] pubEncoded = pub.getEncoded(); // SubjectPublicKeyInfo, last 65 bytes = raw point
                byte[] rawPub = Arrays.copyOfRange(pubEncoded, pubEncoded.length - 65, pubEncoded.length);

                ECPrivateKey priv = (ECPrivateKey) kp.getPrivate();
                byte[] privScalar = toFixed32Bytes(priv.getS());

                VapidKey k = new VapidKey();
                k.setId((short) 1);
                k.setPublicKey(Base64.getUrlEncoder().withoutPadding().encodeToString(rawPub));
                k.setPrivateKey(Base64.getUrlEncoder().withoutPadding().encodeToString(privScalar));
                log.info("[WebPush] Generated new VAPID key pair");
                return vapidRepo.save(k);
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate VAPID keys", e);
            }
        });

        vapidPublicKey = keys.getPublicKey();
        try {
            pushService = new PushService(keys.getPublicKey(), keys.getPrivateKey());
            pushService.setSubject("mailto:admin@list-me.net");
        } catch (Exception e) {
            log.error("[WebPush] Failed to init PushService", e);
        }
    }

    public String getPublicKey() {
        return vapidPublicKey;
    }

    @Transactional
    public void subscribe(User user, String endpoint, String p256dh, String auth) {
        subRepo.findByEndpoint(endpoint).ifPresentOrElse(
            existing -> {}, // already registered
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
                Notification notification = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuthKey(), payloadBytes);
                pushService.send(notification);
            } catch (Exception e) {
                String msg = e.getMessage();
                if (msg != null && (msg.contains("410") || msg.contains("404"))) {
                    subRepo.delete(sub); // subscription expired — clean up
                } else {
                    log.warn("[WebPush] Failed to send push to {}: {}", sub.getEndpoint(), msg);
                }
            }
        }
    }

    private static byte[] toFixed32Bytes(BigInteger n) {
        byte[] raw = n.toByteArray();
        if (raw.length == 32) return raw;
        byte[] fixed = new byte[32];
        if (raw.length > 32) {
            System.arraycopy(raw, raw.length - 32, fixed, 0, 32);
        } else {
            System.arraycopy(raw, 0, fixed, 32 - raw.length, raw.length);
        }
        return fixed;
    }
}
