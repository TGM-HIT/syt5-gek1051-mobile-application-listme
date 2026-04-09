package com.oliwier.listmebackend;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase1IntegrationTest {

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
    static final String DEVICE_B = UUID.randomUUID().toString();
    static String listId;
    static String shareToken;
    static String syncToken;

    // ── Device ──

    @Test @Order(1)
    void deviceAutoRegisters() throws Exception {
        mvc.perform(get("/api/devices/me").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(DEVICE_A));
    }

    @Test @Order(2)
    void rejectsMissingDeviceHeader() throws Exception {
        mvc.perform(get("/api/devices/me"))
                .andExpect(status().isBadRequest());
    }

    // ── Lists ──

    @Test @Order(10)
    void createList() throws Exception {
        String body = mapper.writeValueAsString(java.util.Map.of("name", "Weekly Groceries", "emoji", "\uD83D\uDED2"));

        MvcResult result = mvc.perform(post("/api/lists")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Weekly Groceries"))
                .andExpect(jsonPath("$.participantCount").value(1))
                .andReturn();

        JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
        listId = json.get("id").asString();
    }

    @Test @Order(11)
    void getMyLists() throws Exception {
        mvc.perform(get("/api/lists").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ── Sharing ──

    @Test @Order(20)
    void shareList() throws Exception {
        MvcResult result = mvc.perform(post("/api/lists/" + listId + "/share")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
        shareToken = json.get("token").asString();
    }

    @Test @Order(21)
    void previewSharedList() throws Exception {
        mvc.perform(get("/api/share/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Weekly Groceries"));
    }

    @Test @Order(22)
    void joinSharedList() throws Exception {
        mvc.perform(post("/api/share/" + shareToken + "/join")
                        .header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participantCount").value(2));
    }

    @Test @Order(23)
    void deviceBSeesSharedList() throws Exception {
        mvc.perform(get("/api/lists").header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Weekly Groceries"));
    }

    // ── Sync Tokens ──

    @Test @Order(30)
    void createSyncToken() throws Exception {
        MvcResult result = mvc.perform(post("/api/sync")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listCount").value(1))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
        syncToken = json.get("token").asString();
    }

    @Test @Order(31)
    void previewSyncToken() throws Exception {
        mvc.perform(get("/api/sync/" + syncToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lists.length()").value(1));
    }

    @Test @Order(32)
    void applySyncTokenToNewDevice() throws Exception {
        String deviceC = UUID.randomUUID().toString();

        mvc.perform(post("/api/sync/" + syncToken + "/apply")
                        .header("X-Device-Id", deviceC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lists.length()").value(1));

        // Verify device C now sees the list
        mvc.perform(get("/api/lists").header("X-Device-Id", deviceC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
