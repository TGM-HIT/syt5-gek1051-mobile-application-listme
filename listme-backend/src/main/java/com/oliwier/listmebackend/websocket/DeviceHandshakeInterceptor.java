package com.oliwier.listmebackend.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * Reads the deviceId from the WebSocket upgrade request query param
 * (?deviceId=<uuid>) and stores it in the session attributes so that
 * STOMP message handlers can access it via SimpMessageHeaderAccessor.
 */
@Component
public class DeviceHandshakeInterceptor implements HandshakeInterceptor {

    public static final String DEVICE_ID_ATTR = "deviceId";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        List<String> deviceIds = UriComponentsBuilder
                .fromUri(request.getURI())
                .build()
                .getQueryParams()
                .get("deviceId");

        if (deviceIds != null && !deviceIds.isEmpty()) {
            attributes.put(DEVICE_ID_ATTR, deviceIds.get(0));
        }
        return true; // always allow — missing deviceId just means no presence tracking
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Exception exception) {}
}
