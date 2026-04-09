package com.oliwier.listmebackend.api.dto;

import java.util.List;

public record SyncApplyResponse(
        List<ListResponse> lists,
        String displayName,
        String profilePicture,
        String theme,
        int presetsImported
) {}
