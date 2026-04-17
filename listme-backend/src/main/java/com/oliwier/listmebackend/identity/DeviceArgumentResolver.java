package com.oliwier.listmebackend.identity;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.DeviceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DeviceArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String DEVICE_HEADER = "X-Device-Id";
    private static final String USER_HEADER = "X-User-Id";

    private final DeviceService deviceService;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentDevice.class)
               && Device.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Device resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {

        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String rawDevice = request.getHeader(DEVICE_HEADER);
        if (rawDevice == null || rawDevice.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "X-Device-Id header is required");
        }

        UUID deviceId;
        try {
            deviceId = UUID.fromString(rawDevice.trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "X-Device-Id must be a valid UUID");
        }

        // Resolve userId: prefer X-User-Id, fall back to X-Device-Id (same UUID used as userId for older clients)
        String rawUser = request.getHeader(USER_HEADER);
        if (rawUser == null || rawUser.isBlank()) rawUser = rawDevice;

        UUID userId;
        try {
            userId = UUID.fromString(rawUser.trim());
        } catch (IllegalArgumentException e) {
            userId = deviceId; // safe fallback
        }

        return deviceService.getOrCreate(deviceId, userId);
    }
}
