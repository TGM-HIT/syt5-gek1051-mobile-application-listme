package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.*;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.SyncToken;
import com.oliwier.listmebackend.domain.service.SyncTokenService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncTokenController {

    private final SyncTokenService syncTokenService;

    @PostMapping
    @Transactional
    SyncTokenResponse create(@CurrentDevice Device device, @RequestBody(required = false) CreateSyncTokenRequest req) {
        String theme = req != null ? req.theme() : null;
        SyncToken token = syncTokenService.create(device, theme);
        return new SyncTokenResponse(token.getToken(), token.getLists().size(), token.getExpiresAt());
    }

    @GetMapping("/{token}")
    SyncPreviewResponse preview(@PathVariable String token) {
        SyncToken syncToken = syncTokenService.resolve(token);
        var lists = syncToken.getLists().stream().map(ListResponse::from).toList();
        return new SyncPreviewResponse(
                lists,
                syncToken.getDisplayNameSnapshot(),
                syncToken.getProfilePictureSnapshot(),
                syncToken.getThemeSnapshot()
        );
    }

    @PostMapping("/{token}/apply")
    @Transactional
    SyncApplyResponse apply(@CurrentDevice Device device, @PathVariable String token) {
        return syncTokenService.apply(token, device);
    }
}
