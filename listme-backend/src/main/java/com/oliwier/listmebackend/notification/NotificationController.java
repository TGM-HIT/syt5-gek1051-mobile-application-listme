package com.oliwier.listmebackend.notification;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<String> getVapidPublicKey() {
        return ResponseEntity.ok(notificationService.getVapidPublicKey());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @CurrentDevice Device device,
            @Valid @RequestBody SubscribeRequest req
    ) {
        notificationService.saveSubscription(device, req.endpoint(), req.p256dh(), req.auth());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(
            @CurrentDevice Device device,
            @RequestBody SubscribeRequest req
    ) {
        notificationService.removeSubscription(device, req.endpoint());
        return ResponseEntity.noContent().build();
    }
}
