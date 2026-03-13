package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.Favorite;

import java.util.UUID;

public record FavoriteResponse(UUID id, String itemName, String emoji) {
    public static FavoriteResponse from(Favorite favorite) {
        return new FavoriteResponse(favorite.getId(), favorite.getItemName(), favorite.getEmoji());
    }
}
