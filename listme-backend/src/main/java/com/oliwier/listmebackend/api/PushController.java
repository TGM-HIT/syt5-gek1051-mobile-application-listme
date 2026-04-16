package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.identity.CurrentUser;
import com.oliwier.listmebackend.notification.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushService webPushService;

    @GetMapping("/public-key")
    public Map<String, String> getPublicKey() {
        return Map.of("publicKey", webPushService.getPublicKey());
    }

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@CurrentUser User user, @RequestBody SubscribeRequest body) {
        webPushService.subscribe(user, body.endpoint(), body.keys().p256dh(), body.keys().auth());
    }

    @DeleteMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@RequestBody UnsubscribeRequest body) {
        webPushService.unsubscribe(body.endpoint());
    }

    public record SubscribeRequest(String endpoint, Keys keys) {
        public record Keys(String p256dh, String auth) {}
    }

    public record UnsubscribeRequest(String endpoint) {}
}
