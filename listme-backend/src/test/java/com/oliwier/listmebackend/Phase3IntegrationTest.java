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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T3 integration tests — covers controllers not exercised by Phase2IntegrationTest:
 * Device, Label, Share, SyncToken, Favorite, Preset, Budget, Export,
 * and List extras (duplicate, participants).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase3IntegrationTest {

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
    static String labelId;
    static String favoriteId;
    static String presetId;
    static String shareToken;
    static String syncToken;

    // ── Setup: create a list + item used by all subsequent tests ─────────

    @Test @Order(5)
    void setup_createList() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Wocheneinkauf", "emoji", "🛒"));
        MvcResult r = mvc.perform(post("/api/lists")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        listId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(6)
    void setup_createItem() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Äpfel", "price", 2.50));
        MvcResult r = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        itemId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();
    }

    // ── DeviceController ──────────────────────────────────────────────────

    @Test @Order(10)
    void device_me_returnsCurrentDevice() throws Exception {
        mvc.perform(get("/api/devices/me").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(DEVICE_A));
    }

    @Test @Order(11)
    void device_updateMe_persistsDisplayName() throws Exception {
        String body = mapper.writeValueAsString(Map.of("displayName", "Tester A", "profilePicture", ""));
        mvc.perform(patch("/api/devices/me")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Tester A"));
    }

    @Test @Order(12)
    void device_getById_returnsDevice() throws Exception {
        mvc.perform(get("/api/devices/" + DEVICE_A).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(DEVICE_A));
    }

    @Test @Order(13)
    void device_getById_unknownReturns404() throws Exception {
        mvc.perform(get("/api/devices/" + UUID.randomUUID()).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNotFound());
    }

    // ── LabelController ───────────────────────────────────────────────────

    @Test @Order(20)
    void label_create_returnsCreated() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Bio", "color", "#A6D189"));
        MvcResult r = mvc.perform(post("/api/lists/" + listId + "/labels")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Bio"))
                .andExpect(jsonPath("$.color").value("#A6D189"))
                .andReturn();
        labelId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(21)
    void label_getAll_returnsList() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/labels").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Bio"));
    }

    @Test @Order(22)
    void label_update_persistsChanges() throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "Regional", "color", "#81C8BE"));
        mvc.perform(put("/api/lists/" + listId + "/labels/" + labelId)
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Regional"));
    }

    @Test @Order(23)
    void label_delete_removesLabel() throws Exception {
        mvc.perform(delete("/api/lists/" + listId + "/labels/" + labelId)
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists/" + listId + "/labels").header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── ListController extras ─────────────────────────────────────────────

    @Test @Order(30)
    void list_participants_returnsOwner() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/participants").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].role").value("owner"));
    }

    @Test @Order(31)
    void list_duplicate_createsKopie() throws Exception {
        mvc.perform(post("/api/lists/" + listId + "/duplicate").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(containsString("(Kopie)")));

        mvc.perform(get("/api/lists").header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$.length()").value(2));
    }

    // ── ShareController ───────────────────────────────────────────────────

    @Test @Order(40)
    void share_generate_returnsToken() throws Exception {
        MvcResult r = mvc.perform(post("/api/lists/" + listId + "/share")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        shareToken = mapper.readTree(r.getResponse().getContentAsString()).get("token").asString();
    }

    @Test @Order(41)
    void share_preview_returnsListInfo() throws Exception {
        mvc.perform(get("/api/share/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Wocheneinkauf"));
    }

    @Test @Order(42)
    void share_join_addsDeviceB() throws Exception {
        mvc.perform(post("/api/share/" + shareToken + "/join")
                        .header("X-Device-Id", DEVICE_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listId));

        // Device B now sees the list
        mvc.perform(get("/api/lists").header("X-Device-Id", DEVICE_B))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test @Order(43)
    void share_join_unknownTokenReturns404() throws Exception {
        mvc.perform(post("/api/share/INVALID_TOKEN/join")
                        .header("X-Device-Id", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
    }

    @Test @Order(44)
    void share_revoke_clearsToken() throws Exception {
        mvc.perform(delete("/api/lists/" + listId + "/share")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());
    }

    // ── SyncTokenController ───────────────────────────────────────────────

    @Test @Order(50)
    void syncToken_create_returnsToken() throws Exception {
        MvcResult r = mvc.perform(post("/api/sync")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        syncToken = mapper.readTree(r.getResponse().getContentAsString()).get("token").asString();
    }

    @Test @Order(51)
    void syncToken_preview_returnsLists() throws Exception {
        mvc.perform(get("/api/sync/" + syncToken).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test @Order(52)
    void syncToken_apply_linksNewDevice() throws Exception {
        String deviceC = UUID.randomUUID().toString();
        mvc.perform(post("/api/sync/" + syncToken + "/apply")
                        .header("X-Device-Id", deviceC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));
    }

    // ── FavoriteController ────────────────────────────────────────────────

    @Test @Order(60)
    void favorite_create_returnsCreated() throws Exception {
        String body = mapper.writeValueAsString(Map.of("itemName", "Milch", "emoji", "🥛"));
        MvcResult r = mvc.perform(post("/api/favorites")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemName").value("Milch"))
                .andReturn();
        favoriteId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(61)
    void favorite_getMyFavorites_returnsList() throws Exception {
        mvc.perform(get("/api/favorites").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].itemName").value("Milch"));
    }

    @Test @Order(62)
    void favorite_delete_removesEntry() throws Exception {
        mvc.perform(delete("/api/favorites/" + favoriteId).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/favorites").header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── PresetController ──────────────────────────────────────────────────

    @Test @Order(70)
    void preset_create_fromList() throws Exception {
        String body = mapper.writeValueAsString(
                Map.of("name", "Vorlage Woche", "emoji", "📋", "fromListId", listId));
        MvcResult r = mvc.perform(post("/api/presets")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Vorlage Woche"))
                .andReturn();
        presetId = mapper.readTree(r.getResponse().getContentAsString()).get("id").asString();
    }

    @Test @Order(71)
    void preset_getAll_returnsList() throws Exception {
        // 1 user-created preset + 1 system preset (seeded by migration)
        mvc.perform(get("/api/presets").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test @Order(72)
    void preset_getItems_returnsPresetItems() throws Exception {
        mvc.perform(get("/api/presets/" + presetId + "/items").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test @Order(73)
    void preset_createListFromPreset_copiesItems() throws Exception {
        String body = mapper.writeValueAsString(
                Map.of("name", "Aus Vorlage", "emoji", "🛒", "presetId", presetId));
        mvc.perform(post("/api/lists")
                        .header("X-Device-Id", DEVICE_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Aus Vorlage"))
                .andExpect(jsonPath("$.itemCount").value(greaterThanOrEqualTo(1)));
    }

    @Test @Order(74)
    void preset_delete_removesPreset() throws Exception {
        mvc.perform(delete("/api/presets/" + presetId).header("X-Device-Id", DEVICE_A))
                .andExpect(status().isNoContent());

        // only the system preset remains after deleting the user-created one
        mvc.perform(get("/api/presets").header("X-Device-Id", DEVICE_A))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].system").value(true));
    }

    // ── BudgetController ──────────────────────────────────────────────────

    @Test @Order(80)
    void budget_get_returnsTotals() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/budget").header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").exists())
                .andExpect(jsonPath("$.byCategory").exists());
    }

    // ── ExportController ──────────────────────────────────────────────────

    @Test @Order(90)
    void export_csv_returnsCorrectContentType() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/export")
                        .param("format", "csv")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("liste.csv")))
                .andExpect(content().contentTypeCompatibleWith(new MediaType("text", "csv")));
    }

    @Test @Order(91)
    void export_pdf_returnsCorrectContentType() throws Exception {
        mvc.perform(get("/api/lists/" + listId + "/export")
                        .param("format", "pdf")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("liste.pdf")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF));
    }

    // ── ItemHistoryController ─────────────────────────────────────────────

    @Test @Order(100)
    void itemHistory_returnsResults() throws Exception {
        mvc.perform(get("/api/items/history")
                        .param("q", "Äpfel")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test @Order(101)
    void itemHistory_emptyQuery_returnsAll() throws Exception {
        mvc.perform(get("/api/items/history")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test @Order(102)
    void itemHistory_limitParam_isRespected() throws Exception {
        mvc.perform(get("/api/items/history")
                        .param("limit", "1")
                        .header("X-Device-Id", DEVICE_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(lessThanOrEqualTo(1)));
    }
}
