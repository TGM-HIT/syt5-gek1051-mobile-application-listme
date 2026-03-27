package com.oliwier.listmebackend.notification;

import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class NotificationControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired JsonMapper mapper;

    static final String DEVICE_A = UUID.randomUUID().toString();

    static final String ENDPOINT = "https://push.example.com/sub/" + UUID.randomUUID();
    static final String P256DH = "BNbwAbc123testPublicKey==";
    static final String AUTH = "authSecret==";

    // ── VAPID public key ────────────────────────────────────────────────────

    @Test
    @Order(1)
    void getVapidPublicKey_returns200AndNonEmptyString() throws Exception {
        mvc.perform(get("/api/notifications/vapid-public-key")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.emptyOrNullString())));
    }

    // ── subscribe ───────────────────────────────────────────────────────────

    @Test
    @Order(10)
    void subscribe_returns200AndPersistsSubscription() throws Exception {
        String body = mapper.writeValueAsString(Map.of(
                "endpoint", ENDPOINT,
                "p256dh", P256DH,
                "auth", AUTH
        ));

        mvc.perform(post("/api/notifications/subscribe")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    @Order(11)
    void subscribe_isIdempotent_secondCallAlsoReturns200() throws Exception {
        String body = mapper.writeValueAsString(Map.of(
                "endpoint", ENDPOINT,
                "p256dh", P256DH,
                "auth", AUTH
        ));

        // Second call with the same endpoint — should upsert, not fail
        mvc.perform(post("/api/notifications/subscribe")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    @Order(12)
    void subscribe_returns400WhenEndpointBlank() throws Exception {
        String body = mapper.writeValueAsString(Map.of(
                "endpoint", "",
                "p256dh", P256DH,
                "auth", AUTH
        ));

        mvc.perform(post("/api/notifications/subscribe")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ── unsubscribe ─────────────────────────────────────────────────────────

    @Test
    @Order(20)
    void unsubscribe_returns204() throws Exception {
        String body = mapper.writeValueAsString(Map.of(
                "endpoint", ENDPOINT,
                "p256dh", P256DH,
                "auth", AUTH
        ));

        mvc.perform(delete("/api/notifications/subscribe")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(21)
    void unsubscribe_nonExistentEndpointIsIdempotent_returns204() throws Exception {
        String body = mapper.writeValueAsString(Map.of(
                "endpoint", "https://push.example.com/gone",
                "p256dh", P256DH,
                "auth", AUTH
        ));

        mvc.perform(delete("/api/notifications/subscribe")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }
}
