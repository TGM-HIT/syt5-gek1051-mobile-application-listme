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

    // ── WebSocket helpers ──

    StompSession connect(String deviceId) throws Exception {
        String url = "ws://localhost:" + port + "/ws/websocket?deviceId=" + deviceId;
        return stompClient()
                .connectAsync(url, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
    }

    BlockingQueue<Map<String, Object>> subscribePresence(StompSession session, String lid) {
        BlockingQueue<Map<String, Object>> q = new ArrayBlockingQueue<>(10);
        session.subscribe("/topic/list/" + lid + "/presence", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return String.class; }
            @Override public void handleFrame(StompHeaders h, Object p) {
                try { q.add(parseMsg((String) p)); } catch (Exception e) { throw new RuntimeException(e); }
            }
        });
        return q;
    }

    // ── Tests ──

    @Test
    @Order(20)
    void join_broadcastsJoinedPresenceEvent() throws Exception {
        StompSession sessionA = connect(DEVICE_A);
        BlockingQueue<Map<String, Object>> queue = subscribePresence(sessionA, listId);

        sessionA.send("/app/list/" + listId + "/join", "");

        Map<String, Object> msg = queue.poll(5, TimeUnit.SECONDS);
        assertThat(msg).isNotNull();
        assertThat(msg.get("event")).isEqualTo("joined");
        assertThat(msg.get("deviceId")).isEqualTo(DEVICE_A);

        sessionA.disconnect();
    }

    @Test
    @Order(30)
    void join_onlineDevicesIncludesJoiningDevice() throws Exception {
        StompSession sessionA = connect(DEVICE_A);
        BlockingQueue<Map<String, Object>> queue = subscribePresence(sessionA, listId);

        sessionA.send("/app/list/" + listId + "/join", "");

        Map<String, Object> msg = queue.poll(5, TimeUnit.SECONDS);
        assertThat(msg).isNotNull();
        @SuppressWarnings("unchecked")
        var online = (java.util.List<String>) msg.get("onlineDevices");
        assertThat(online).contains(DEVICE_A);

        sessionA.disconnect();
    }

    @Test
    @Order(40)
    void leave_broadcastsLeftPresenceEvent() throws Exception {
        StompSession sessionA = connect(DEVICE_A);
        BlockingQueue<Map<String, Object>> queue = subscribePresence(sessionA, listId);

        sessionA.send("/app/list/" + listId + "/join", "");
        queue.poll(5, TimeUnit.SECONDS); // consume join event

        sessionA.send("/app/list/" + listId + "/leave", "");

        Map<String, Object> msg = queue.poll(5, TimeUnit.SECONDS);
        assertThat(msg).isNotNull();
        assertThat(msg.get("event")).isEqualTo("left");
        assertThat(msg.get("deviceId")).isEqualTo(DEVICE_A);

        sessionA.disconnect();
    }

    @Test
    @Order(50)
    void twoDevices_bothReceivePresenceEvents() throws Exception {
        StompSession sessionA = connect(DEVICE_A);
        StompSession sessionB = connect(DEVICE_B);

        BlockingQueue<Map<String, Object>> queueA = subscribePresence(sessionA, listId);
        BlockingQueue<Map<String, Object>> queueB = subscribePresence(sessionB, listId);

        sessionA.send("/app/list/" + listId + "/join", "");
        sessionB.send("/app/list/" + listId + "/join", "");

        // Both sessions receive events
        Map<String, Object> msgA = queueA.poll(5, TimeUnit.SECONDS);
        assertThat(msgA).isNotNull();

        Map<String, Object> msgB = queueB.poll(5, TimeUnit.SECONDS);
        assertThat(msgB).isNotNull();

        sessionA.disconnect();
        sessionB.disconnect();
    }

    @Test
    @Order(60)
    void connectWithoutDeviceId_doesNotCrash() throws Exception {
        // deviceId-less connections should be allowed (interceptor returns true always)
        String url = "ws://localhost:" + port + "/ws/websocket";
        StompSession session = stompClient()
                .connectAsync(url, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
        assertThat(session.isConnected()).isTrue();
        session.disconnect();
    }

}
