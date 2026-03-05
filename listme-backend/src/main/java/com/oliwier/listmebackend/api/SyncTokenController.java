package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.api.dto.SyncTokenResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.model.SyncToken;
import com.oliwier.listmebackend.domain.service.SyncTokenService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncTokenController {

    private final SyncTokenService syncTokenService;

    @PostMapping
    @Transactional
    public SyncTokenResponse create(@CurrentDevice Device device) {
        SyncToken token = syncTokenService.create(device);
        return new SyncTokenResponse(token.getToken(), token.getLists().size(), token.getExpiresAt());
    }

    @GetMapping("/{token}")
    public List<ListResponse> preview(@PathVariable String token) {
        SyncToken syncToken = syncTokenService.resolve(token);
        return syncToken.getLists().stream().map(ListResponse::from).toList();
    }

    @PostMapping("/{token}/apply")
    @Transactional
    public List<ListResponse> apply(@CurrentDevice Device device, @PathVariable String token) {
        Set<ShoppingList> lists = syncTokenService.apply(token, device);
        return lists.stream().map(ListResponse::from).toList();
    }
}
