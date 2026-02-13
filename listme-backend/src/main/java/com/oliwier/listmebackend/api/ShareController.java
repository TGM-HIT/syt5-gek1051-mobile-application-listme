package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.api.dto.ShareTokenResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.domain.service.ShareService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShareController {

    private final ShareService shareService;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;

    @PostMapping("/api/lists/{listId}/share")
    @Transactional
    public ShareTokenResponse share(@CurrentDevice Device device, @PathVariable UUID listId) {
        ShoppingList list = getListForDevice(listId, device);
        String token = shareService.generateShareToken(list);
        return new ShareTokenResponse(token, list.getId(), list.getName());
    }

    @DeleteMapping("/api/lists/{listId}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void revokeShare(@CurrentDevice Device device, @PathVariable UUID listId) {
        ShoppingList list = getListForDevice(listId, device);
        shareService.revokeShareToken(list);
    }

    @GetMapping("/api/share/{token}")
    public ListResponse preview(@PathVariable String token) {
        ShoppingList list = shareService.findByShareToken(token);
        return ListResponse.from(list);
    }

    @PostMapping("/api/share/{token}/join")
    @Transactional
    public ListResponse join(@CurrentDevice Device device, @PathVariable String token) {
        ShoppingList list = shareService.joinViaShareToken(token, device);
        return ListResponse.from(list);
    }

    private ShoppingList getListForDevice(UUID listId, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have access to this list");
        }
        return list;
    }
}
