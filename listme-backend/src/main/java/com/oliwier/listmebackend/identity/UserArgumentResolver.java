package com.oliwier.listmebackend.identity;

import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.service.UserService;
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
public class UserArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String HEADER = "X-User-Id";

    private final UserService userService;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
               && User.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public User resolveArgument(MethodParameter parameter,
                                ModelAndViewContainer mavContainer,
                                NativeWebRequest webRequest,
                                WebDataBinderFactory binderFactory) {

        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String raw = request.getHeader(HEADER);
        if (raw == null || raw.isBlank()) {
            // Fall back to X-Device-Id: the V15 migration created a user with the same UUID
            // for every pre-existing device, so this maintains backward compatibility.
            raw = request.getHeader("X-Device-Id");
        }
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "X-User-Id header is required");
        }

        UUID userId;
        try {
            userId = UUID.fromString(raw.trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "X-User-Id must be a valid UUID");
        }

        return userService.getOrCreate(userId);
    }
}
