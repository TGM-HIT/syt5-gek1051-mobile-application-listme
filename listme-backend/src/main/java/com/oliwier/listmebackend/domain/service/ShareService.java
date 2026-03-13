package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ListDevice;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class ShareService {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;

    @Transactional
    public String generateShareToken(ShoppingList list) {
        if (list.getShareToken() != null) {
            return list.getShareToken();
        }
        String token = randomToken(TOKEN_LENGTH);
        list.setShareToken(token);
        listRepository.save(list);
        return token;
    }

    @Transactional
    public void revokeShareToken(ShoppingList list) {
        list.setShareToken(null);
        listRepository.save(list);
    }

    @Transactional(readOnly = true)
    public ShoppingList findByShareToken(String token) {
        return listRepository.findByShareToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid share link"));
    }

    @Transactional
    public ShoppingList joinViaShareToken(String token, Device device) {
        ShoppingList list = findByShareToken(token);

        if (!listDeviceRepository.existsByListIdAndDeviceId(list.getId(), device.getId())) {
            ListDevice ld = new ListDevice(list, device, "editor");
            list.getListDevices().add(ld);
            listRepository.save(list);
        }
        return list;
    }

    private String randomToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
