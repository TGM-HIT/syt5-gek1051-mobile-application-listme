package com.oliwier.listmebackend.websocket;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory tracker of which devices are currently
 * subscribed to (viewing) which lists.
 *
 * listId → Set<deviceId>
 */
@Component
public class PresenceTracker {

    private final Map<UUID, Set<String>> listToDevices = new ConcurrentHashMap<>();

    public void join(UUID listId, String deviceId) {
        listToDevices
                .computeIfAbsent(listId, k -> ConcurrentHashMap.newKeySet())
                .add(deviceId);
    }

    public void leave(UUID listId, String deviceId) {
        Set<String> devices = listToDevices.get(listId);
        if (devices != null) {
            devices.remove(deviceId);
            if (devices.isEmpty()) listToDevices.remove(listId);
        }
    }

    /** Remove a device from ALL lists (called on WebSocket disconnect). */
    public void disconnectDevice(String deviceId) {
        listToDevices.values().forEach(devices -> devices.remove(deviceId));
        listToDevices.entrySet().removeIf(e -> e.getValue().isEmpty());
    }

    public Set<String> getOnlineDevices(UUID listId) {
        return Collections.unmodifiableSet(
                listToDevices.getOrDefault(listId, Collections.emptySet())
        );
    }
}
