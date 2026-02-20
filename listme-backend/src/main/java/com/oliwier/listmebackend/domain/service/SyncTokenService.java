package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.domain.repository.SyncTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SyncTokenService {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SyncTokenRepository syncTokenRepository;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;

    @Transactional
    public SyncToken create(Device device) {
        List<ShoppingList> deviceLists = listRepository.findAllByDeviceId(device.getId());

        SyncToken syncToken = new SyncToken();
        syncToken.setToken(randomToken(TOKEN_LENGTH));
        syncToken.setCreatedByDevice(device);
        syncToken.setLists(new HashSet<>(deviceLists));
        syncToken.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));

        return syncTokenRepository.save(syncToken);
    }

    @Transactional(readOnly = true)
    public SyncToken resolve(String token) {
        SyncToken syncToken = syncTokenRepository.findById(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid sync token"));

        if (syncToken.getExpiresAt() != null && syncToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Sync token has expired");
        }
        return syncToken;
    }

    @Transactional
    public Set<ShoppingList> apply(String token, Device device) {
        SyncToken syncToken = resolve(token);

        for (ShoppingList list : syncToken.getLists()) {
            if (!listDeviceRepository.existsByListIdAndDeviceId(list.getId(), device.getId())) {
                listDeviceRepository.save(new ListDevice(list, device, "editor"));
            }
        }
        return syncToken.getLists();
    }

    private String randomToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
