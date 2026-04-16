package com.oliwier.listmebackend.api.dto;

import com.oliwier.listmebackend.domain.model.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String displayName,
        String profilePicture,
        String theme
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getDisplayName(), u.getProfilePicture(), u.getTheme());
    }
}
