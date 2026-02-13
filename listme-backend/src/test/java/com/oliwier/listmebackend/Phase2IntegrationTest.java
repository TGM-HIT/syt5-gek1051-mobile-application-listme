package com.oliwier.listmebackend;

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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase2IntegrationTest {

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
    static String listId;
    static String itemId;
    static String categoryId;

    // ── List CRUD ──

    @Test @Order(10)
    void createList() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Supermarkt", "emoji", "🛒"));

        MvcResult result = mvc.perform(post("/api/lists")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Supermarkt"))
                .andReturn();

        listId = mapper.readTree(result.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(11)
    void getList() throws Exception {
        mvc.perform(get("/api/lists/" + listId).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Supermarkt"));
    }

    @Test @Order(12)
    void updateList() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Wocheneinkauf", "emoji", "🥦"));

        mvc.perform(put("/api/lists/" + listId)
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Wocheneinkauf"))
                .andExpect(jsonPath("$.emoji").value("🥦"));
    }

    @Test @Order(13)
    void getListReturns403ForNonParticipant() throws Exception {
        String otherDevice = UUID.randomUUID().toString();
        mvc.perform(get("/api/lists/" + listId).header("X-Device-Id", otherDevice))
                .andExpect(status().isForbidden());
    }

    // ── Categories ──

    @Test @Order(20)
    void createCategory() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Obst & Gemüse", "color", "#A6D189"));

        MvcResult result = mvc.perform(post("/api/lists/" + listId + "/categories")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Obst & Gemüse"))
                .andExpect(jsonPath("$.color").value("#A6D189"))
                .andReturn();

        categoryId = mapper.readTree(result.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(21)
    void getCategories() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/categories").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test @Order(22)
    void updateCategory() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Früchte", "color", "#81C8BE"));

        mvc.perform(put("/api/lists/" + listId + "/categories/" + categoryId)
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Früchte"));
    }

    // ── Items ──

    @Test @Order(30)
    void createItem() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Äpfel", "categoryId", categoryId));

        MvcResult result = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Äpfel"))
                .andExpect(jsonPath("$.checked").value(false))
                .andExpect(jsonPath("$.categoryName").value("Früchte"))
                .andReturn();

        itemId = mapper.readTree(result.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(31)
    void createSecondItem() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Bananen"));

        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.position").value(1));
    }

    @Test @Order(32)
    void getItems() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/items").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test @Order(33)
    void checkItem() throws Exception {
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId + "/check")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checked").value(true));
    }

    @Test @Order(34)
    void uncheckItem() throws Exception {
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId + "/check")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checked").value(false));
    }

    @Test @Order(35)
    void updateItem() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Grüne Äpfel"));

        mvc.perform(put("/api/lists/" + listId + "/items/" + itemId)
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Grüne Äpfel"))
                .andExpect(jsonPath("$.categoryId").isEmpty());
    }

    @Test @Order(36)
    void deleteItem() throws Exception {
        mvc.perform(delete("/api/lists/" + listId + "/items/" + itemId)
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists/" + listId + "/items").header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test @Order(37)
    void deleteCategory() throws Exception {
        mvc.perform(delete("/api/lists/" + listId + "/categories/" + categoryId)
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());
    }

    // ── List deletion ──

    @Test @Order(40)
    void deleteListRemovesDevice() throws Exception {
        mvc.perform(delete("/api/lists/" + listId).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
