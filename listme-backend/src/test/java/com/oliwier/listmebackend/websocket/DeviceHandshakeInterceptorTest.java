package com.oliwier.listmebackend.websocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class DeviceHandshakeInterceptorTest {

    DeviceHandshakeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new DeviceHandshakeInterceptor();
    }

    @Test
    void beforeHandshake_withDeviceId_storesInAttributes() throws Exception {
        var request = new MockHttpServletRequest();
        request.setRequestURI("/ws/websocket");
        request.setQueryString("deviceId=abc-123");

        Map<String, Object> attrs = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
                new org.springframework.http.server.ServletServerHttpRequest(request),
                new org.springframework.http.server.ServletServerHttpResponse(new MockHttpServletResponse()),
                mock(WebSocketHandler.class),
                attrs
        );

        assertThat(result).isTrue();
        assertThat(attrs).containsEntry(DeviceHandshakeInterceptor.DEVICE_ID_ATTR, "abc-123");
    }

    @Test
    void beforeHandshake_withoutDeviceId_noAttributeSet() throws Exception {
        var request = new MockHttpServletRequest();
        request.setRequestURI("/ws/websocket");

        Map<String, Object> attrs = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
                new org.springframework.http.server.ServletServerHttpRequest(request),
                new org.springframework.http.server.ServletServerHttpResponse(new MockHttpServletResponse()),
                mock(WebSocketHandler.class),
                attrs
        );

        assertThat(result).isTrue();
        assertThat(attrs).doesNotContainKey(DeviceHandshakeInterceptor.DEVICE_ID_ATTR);
    }

    @Test
    void beforeHandshake_withMultipleParams_extractsDeviceIdCorrectly() throws Exception {
        var request = new MockHttpServletRequest();
        request.setRequestURI("/ws/websocket");
        request.setQueryString("foo=bar&deviceId=dev-xyz&baz=qux");

        Map<String, Object> attrs = new HashMap<>();
        interceptor.beforeHandshake(
                new org.springframework.http.server.ServletServerHttpRequest(request),
                new org.springframework.http.server.ServletServerHttpResponse(new MockHttpServletResponse()),
                mock(WebSocketHandler.class),
                attrs
        );

        assertThat(attrs).containsEntry(DeviceHandshakeInterceptor.DEVICE_ID_ATTR, "dev-xyz");
    }

    @Test
    void afterHandshake_doesNotThrow() {
        // Should be a no-op
        interceptor.afterHandshake(null, null, null, null);
    }

    @Test
    void deviceIdAttrConstant_isDeviceId() {
        assertThat(DeviceHandshakeInterceptor.DEVICE_ID_ATTR).isEqualTo("deviceId");
    }
}
