package com.oliwier.listmebackend;

import com.oliwier.listmebackend.crdt.VectorClock;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase3CrdtTest {

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
    static String itemId;

    // ══════════════════════════════════════════════════════════════════════
    // VectorClock unit tests — pure logic, no DB
    // ══════════════════════════════════════════════════════════════════════

    @Test @Order(1)
    void vectorClock_incrementOwnCounter() {
        VectorClock vc = new VectorClock();
        VectorClock incremented = vc.increment("device-A");
        assertThat(incremented.get("device-A")).isEqualTo(1L);
        assertThat(vc.get("device-A")).isEqualTo(0L); // original immutable
    }

    @Test @Order(2)
    void vectorClock_mergeMaxPerDevice() {
        VectorClock a = VectorClock.of(Map.of("dev-A", 5L, "dev-B", 2L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 3L, "dev-B", 7L, "dev-C", 1L));
        VectorClock merged = a.merge(b);
        assertThat(merged.get("dev-A")).isEqualTo(5L);
        assertThat(merged.get("dev-B")).isEqualTo(7L);
        assertThat(merged.get("dev-C")).isEqualTo(1L);
    }

    @Test @Order(3)
    void vectorClock_compare_before() {
        VectorClock older = VectorClock.of(Map.of("A", 1L, "B", 2L));
        VectorClock newer = VectorClock.of(Map.of("A", 3L, "B", 4L));
        assertThat(older.compare(newer)).isEqualTo(VectorClock.Relation.BEFORE);
        assertThat(newer.compare(older)).isEqualTo(VectorClock.Relation.AFTER);
    }

    @Test @Order(4)
    void vectorClock_compare_concurrent() {
        // A incremented by device-A, B incremented by device-B — neither saw the other
        VectorClock a = VectorClock.of(Map.of("dev-A", 2L, "dev-B", 1L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 1L, "dev-B", 2L));
        assertThat(a.compare(b)).isEqualTo(VectorClock.Relation.CONCURRENT);
        assertThat(b.compare(a)).isEqualTo(VectorClock.Relation.CONCURRENT);
    }

    @Test @Order(5)
    void vectorClock_compare_equal() {
        VectorClock a = VectorClock.of(Map.of("X", 3L));
        VectorClock b = VectorClock.of(Map.of("X", 3L));
        assertThat(a.compare(b)).isEqualTo(VectorClock.Relation.EQUAL);
    }

    @Test @Order(6)
    void vectorClock_merge_idempotent() {
        // Merging a clock with itself should yield the same clock
        VectorClock vc = VectorClock.of(Map.of("A", 3L, "B", 5L));
        VectorClock merged = vc.merge(vc);
        assertThat(merged.get("A")).isEqualTo(vc.get("A"));
        assertThat(merged.get("B")).isEqualTo(vc.get("B"));
    }

    @Test @Order(7)
    void vectorClock_merge_commutative() {
        // merge(A, B) == merge(B, A)
        VectorClock a = VectorClock.of(Map.of("dev-A", 5L, "dev-B", 1L));
        VectorClock b = VectorClock.of(Map.of("dev-A", 2L, "dev-B", 8L));
        VectorClock ab = a.merge(b);
        VectorClock ba = b.merge(a);
        assertThat(ab.get("dev-A")).isEqualTo(ba.get("dev-A"));
        assertThat(ab.get("dev-B")).isEqualTo(ba.get("dev-B"));
    }

    @Test @Order(8)
    void vectorClock_merge_associative() {
        // merge(merge(A,B), C) == merge(A, merge(B,C))
        VectorClock a = VectorClock.of(Map.of("x", 1L));
        VectorClock b = VectorClock.of(Map.of("x", 3L));
        VectorClock c = VectorClock.of(Map.of("x", 2L));
        VectorClock left  = a.merge(b).merge(c);
        VectorClock right = a.merge(b.merge(c));
        assertThat(left.get("x")).isEqualTo(right.get("x"));
    }

    // ══════════════════════════════════════════════════════════════════════
    // Integration tests — CRDT ops recorded on item mutations
    // ══════════════════════════════════════════════════════════════════════

    @Test @Order(20)
    void setup_listAndItem() throws Exception {
        String listBody = mapper.writeValueAsString(Map.of("name", "CRDT Test List"));
        MvcResult r = mvc.perform(post("/api/lists")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(listBody))
                .andExpect(status().isCreated())
                .andReturn();
        listId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();

        String itemBody = mapper.writeValueAsString(Map.of("name", "Milk"));
        MvcResult r2 = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemBody))
                .andExpect(status().isCreated())
                .andReturn();
        itemId = mapper.readTree(r2.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(21)
    void clockIncrements_afterItemCreate() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/crdt/clock")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$." + DEVICE_A).value(1));
    }

    @Test @Order(22)
    void opsRecorded_forItemCreate() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].operationType").value("ITEM_CREATE"))
                .andExpect(jsonPath("$[0].payload.itemId").value(itemId));
    }

    @Test @Order(23)
    void clockIncrements_afterToggleCheck() throws Exception {
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId + "/check")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk());

        mvc.perform(get("/api/lists/" + listId + "/crdt/clock")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$." + DEVICE_A).value(2));
    }

    @Test @Order(24)
    void deviceB_seesOpsAfterJoining() throws Exception {
        // Give Device B access via share token
        MvcResult shareResult = mvc.perform(post("/api/lists/" + listId + "/share")
                        .header("X-Device-Id", DEVICE_A))
                .andReturn();
        String token = mapper.readTree(shareResult.getResponse().getContentAsString())
                .get("token").asString();

        mvc.perform(post("/api/share/" + token + "/join")
                        .header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk());

        // Device B fetches ops — should see both ops Device A produced
        mvc.perform(get("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test @Order(25)
    void pushOp_fromDeviceB_appliedToServer() throws Exception {
        // Device B pushes a CHECK op it "did offline"
        UUID opId = UUID.randomUUID();
        String opsBody = mapper.writeValueAsString(java.util.List.of(Map.of(
                "id", opId.toString(),
                "listId", listId,
                "operationType", "ITEM_CHECK",
                "payload", Map.of(
                        "itemId", itemId,
                        "checked", false,
                        "timestamp", System.currentTimeMillis()
                ),
                "vectorClock", Map.of(DEVICE_B, 1)
        )));

        mvc.perform(post("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_B)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(opsBody))
                .andExpect(status().isNoContent());

        // Item should now be unchecked again (Device B's op applied via LWW — same timestamp wins)
        mvc.perform(get("/api/lists/" + listId + "/items")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].checked").value(false));
    }

    @Test @Order(26)
    void pushOp_idempotent_duplicateIgnored() throws Exception {
        // Push the same op ID again — should not create duplicate
        UUID opId = UUID.randomUUID();
        String op = mapper.writeValueAsString(java.util.List.of(Map.of(
                "id", opId.toString(),
                "listId", listId,
                "operationType", "ITEM_CHECK",
                "payload", Map.of("itemId", itemId, "checked", true, "timestamp", System.currentTimeMillis()),
                "vectorClock", Map.of(DEVICE_B, 2)
        )));

        mvc.perform(post("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_B)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(op))
                .andExpect(status().isNoContent());

        // Push same op again
        mvc.perform(post("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_B)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(op))
                .andExpect(status().isNoContent());

        // Verify op count did not double
        MvcResult r = mvc.perform(get("/api/lists/" + listId + "/crdt/ops")
                        .header("X-Device-Id", DEVICE_A))
                .andReturn();
        int opCount = mapper.readTree(r.getResponse().getContentAsString()).size();
        // We had 2 from DEVICE_A, 1 from order 25, 1 from this test = 4 total
        assertThat(opCount).isEqualTo(4);
    }
}
