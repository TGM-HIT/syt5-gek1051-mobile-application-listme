package com.oliwier.listmebackend.api.dto;

import java.util.List;

public record SyncPreviewResponse(
        List<ListResponse> lists,
        String sourceDisplayName,
        String sourceProfilePicture,
        String theme
) {}
