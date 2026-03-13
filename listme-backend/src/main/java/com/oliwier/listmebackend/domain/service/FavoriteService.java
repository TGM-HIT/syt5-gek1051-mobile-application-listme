package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateFavoriteRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Favorite;
import com.oliwier.listmebackend.domain.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public List<Favorite> getMyFavorites(Device device) {
        return favoriteRepository.findByDeviceIdOrderByCreatedAtDesc(device.getId())
                .stream().limit(10).toList();
    }

    @Transactional
    public Favorite create(Device device, CreateFavoriteRequest req) {
        if (favoriteRepository.existsByDeviceIdAndItemName(device.getId(), req.itemName())) {
            return favoriteRepository.findByDeviceIdOrderByCreatedAtDesc(device.getId())
                    .stream()
                    .filter(f -> f.getItemName().equals(req.itemName()))
                    .findFirst()
                    .orElseThrow();
        }
        Favorite favorite = new Favorite();
        favorite.setDevice(device);
        favorite.setItemName(req.itemName());
        favorite.setEmoji(req.emoji());
        return favoriteRepository.save(favorite);
    }

    @Transactional
    public void delete(UUID favoriteId, Device device) {
        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite not found"));
        if (!favorite.getDevice().getId().equals(device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your favorite");
        }
        favoriteRepository.delete(favorite);
    }
}
