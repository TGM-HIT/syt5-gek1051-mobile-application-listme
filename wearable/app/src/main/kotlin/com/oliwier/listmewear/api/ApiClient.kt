package com.oliwier.listmewear.api

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken
import com.oliwier.listmewear.identity.DeviceIdentity
import com.oliwier.listmewear.model.ShoppingItem
import com.oliwier.listmewear.model.ShoppingList
import com.oliwier.listmewear.storage.LocalStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

// ── API DTOs ─────────────────────────────────────────────────────────────────

// POST /api/sync/{token}/apply → SyncApplyResponse
data class ApiSyncApplyResponse(
    val lists: List<ApiListMeta>
)

// ListResponse from backend — IDs only, no items
data class ApiListMeta(
    val id: String,
    val name: String,
    val emoji: String?
)

// GET /api/lists/{listId}/items → List<ApiItem>
data class ApiItem(
    val id: String,
    val name: String,
    val checked: Boolean,
    val quantity: Double?,
    @SerializedName("quantityUnit") val unit: String?,
    val deletedAt: String? = null
)

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * Direct HTTP access to the ListMe backend.
 * Used when the watch has WiFi/LTE but the phone is not nearby.
 * Pixel Watch 3 supports standalone LTE — no phone required.
 */
class ApiClient(private val context: Context) {

    private val gson = Gson()
    private val http = HttpClientFactory.create()

    private val baseUrl: String get() = LocalStorage(context).getServerUrl()
    private val deviceId: String get() = DeviceIdentity.getDeviceId(context)

    /**
     * Applies a sync token — registers this watch device to all lists in the token,
     * then fetches each list's items individually.
     * Backend: POST /api/sync/{token}/apply  +  GET /api/lists/{id}/items
     */
    suspend fun fetchListsViaSyncToken(syncToken: String): List<ShoppingList> = withContext(Dispatchers.IO) {
        // 1. Apply sync token → get list metadata + register watch device
        val applyReq = Request.Builder()
            .url("$baseUrl/api/sync/$syncToken/apply")
            .header("X-Device-Id", deviceId)
            .post("{}".toRequestBody("application/json".toMediaType()))
            .build()
        val applyBody = http.newCall(applyReq).execute().use { it.body?.string() ?: "{}" }
        val applyResponse = gson.fromJson(applyBody, ApiSyncApplyResponse::class.java)
            ?: return@withContext emptyList()

        // 2. Fetch items for each list
        applyResponse.lists.mapNotNull { meta ->
            runCatching { fetchListItems(meta) }.getOrNull()
        }
    }

    private fun fetchListItems(meta: ApiListMeta): ShoppingList {
        val req = Request.Builder()
            .url("$baseUrl/api/lists/${meta.id}/items")
            .header("X-Device-Id", deviceId)
            .get().build()
        val body = http.newCall(req).execute().use { it.body?.string() ?: "[]" }
        val type = object : TypeToken<List<ApiItem>>() {}.type
        val items: List<ApiItem> = gson.fromJson(body, type) ?: emptyList()
        return ShoppingList(
            id = meta.id,
            name = meta.name,
            emoji = meta.emoji ?: "🛒",
            items = items.filter { it.deletedAt == null }.map { it.toModel() }
        )
    }

    /** Toggle checked state. Backend toggles on each call — no body needed. */
    suspend fun checkItem(listId: String, itemId: String, @Suppress("UNUSED_PARAMETER") checked: Boolean) =
        withContext(Dispatchers.IO) {
            val req = Request.Builder()
                .url("$baseUrl/api/lists/$listId/items/$itemId/check")
                .header("X-Device-Id", deviceId)
                .patch("".toRequestBody("application/json".toMediaType()))
                .build()
            http.newCall(req).execute().close()
        }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private fun ApiItem.toModel() = ShoppingItem(
        id = id,
        name = name,
        checked = checked,
        quantity = quantity?.let { q ->
            if (q == q.toLong().toDouble()) q.toLong().toString() else q.toString()
        },
        unit = unit
    )
}
