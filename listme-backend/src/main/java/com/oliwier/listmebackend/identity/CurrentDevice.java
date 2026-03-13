package com.oliwier.listmebackend.identity;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injects the current {@link com.oliwier.listmebackend.domain.model.Device}
 * resolved from the {@code X-Device-Id} request header.
 * Creates the device automatically if it doesn't exist yet.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentDevice {
}
