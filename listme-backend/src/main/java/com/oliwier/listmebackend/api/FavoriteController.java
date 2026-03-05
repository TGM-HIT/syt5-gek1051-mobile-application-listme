package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateFavoriteRequest;
import com.oliwier.listmebackend.api.dto.FavoriteResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.FavoriteService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public List<FavoriteResponse> getMyFavorites(@CurrentDevice Device device) {
        return favoriteService.getMyFavorites(device).stream().map(FavoriteResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public FavoriteResponse create(@CurrentDevice Device device,
                                   @Valid @RequestBody CreateFavoriteRequest req) {
        return FavoriteResponse.from(favoriteService.create(device, req));
    }

    @DeleteMapping("/{favoriteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID favoriteId, @CurrentDevice Device device) {
        favoriteService.delete(favoriteId, device);
    }
}
