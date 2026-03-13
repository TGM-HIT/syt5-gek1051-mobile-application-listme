package com.oliwier.listmebackend;

import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase4IntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    MockMvc mvc;
    @Autowired
    JsonMapper mapper;
    @LocalServerPort
    int port;

    static final String DEVICE_A = UUID.randomUUID().toString();
    static final String DEVICE_B = UUID.randomUUID().toString();
    static String listId;
    static String itemId;

    WebSocketStompClient stompClient() {
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        // StringMessageConverter: receive raw JSON string, parse manually — avoids
        // deprecated converters
        client.setMessageConverter(new StringMessageConverter());
        return client;
    }

    Map<String, Object> parseMsg(String json) throws Exception {
        // noinspection unchecked
        return (Map<String, Object>) mapper.readValue(json, Map.class);
    }

    // ── Setup ──

    @Test
    @Order(10)
    void setup() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "WS Test List"));
        MvcResult r = mvc.perform(post("/api/lists")
                .header("X-Device-Id", DEVICE_A)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        listId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();

        // Give Device B access via share token
        MvcResult shareResult = mvc.perform(post("/api/lists/" + listId + "/share")
                .header("X-Device-Id", DEVICE_A))
                .andReturn();
        String token = mapper.readTree(shareResult.getResponse().getContentAsString())
                .get("token").asString();
        mvc.perform(post("/api/share/" + token + "/join")
                .header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk());
    }

}
