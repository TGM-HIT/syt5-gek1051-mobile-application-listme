package com.oliwier.listmebackend.websocket;

import java.util.Set;

public record PresenceMessage(
        String event,      // "joined" | "left" | "snapshot"
        String deviceId,
        Set<String> onlineDevices
) {}
