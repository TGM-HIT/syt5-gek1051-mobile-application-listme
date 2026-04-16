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
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

// ── API DTOs ─────────────────────────────────────────────────────────────────

data class ApiList(
    val id: String,
    val name: String,
    val emoji: String?,
    val items: List<ApiItem>?
)

data class ApiItem(
    val id: String,
    val name: String,
    val checked: Boolean,
    val quantity: Double?,
    @SerializedName("quantityUnit") val unit: String?
)

data class CheckItemRequest(val checked: Boolean, val deviceId: String)

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * Direct HTTP access to the ListMe backend.
 * Used when the watch has WiFi/LTE but the phone is not nearby.
 * Pixel Watch 3 supports standalone LTE — no phone required.
 */
class ApiClient(private val context: Context) {

    private val gson = Gson()
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val baseUrl: String get() = LocalStorage(context).getServerUrl()
    private val deviceId: String get() = DeviceIdentity.getDeviceId(context)

    /** Fetch all lists linked to a sync token (initial setup or full refresh). */
    suspend fun fetchListsViaSyncToken(syncToken: String): List<ShoppingList> = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url("$baseUrl/api/sync-tokens/$syncToken/lists")
            .header("X-Device-Id", deviceId)
            .get().build()
        val body = http.newCall(req).execute().use { it.body?.string() ?: "[]" }
        val type = object : TypeToken<List<ApiList>>() {}.type
        val apiLists: List<ApiList> = gson.fromJson(body, type) ?: emptyList()
        apiLists.map { it.toModel() }
    }

    /** Refresh a single list (called after checking an item or on manual refresh). */
    suspend fun fetchList(listId: String): ShoppingList = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url("$baseUrl/api/lists/$listId")
            .header("X-Device-Id", deviceId)
            .get().build()
        val body = http.newCall(req).execute().use { it.body?.string() ?: "{}" }
        gson.fromJson(body, ApiList::class.java).toModel()
    }

    /** Toggle the checked state of an item. Sends CRDT operation to server. */
    suspend fun checkItem(listId: String, itemId: String, checked: Boolean) = withContext(Dispatchers.IO) {
        val payload = gson.toJson(CheckItemRequest(checked, deviceId))
        val req = Request.Builder()
            .url("$baseUrl/api/lists/$listId/items/$itemId/check")
            .header("X-Device-Id", deviceId)
            .patch(payload.toRequestBody("application/json".toMediaType()))
            .build()
        http.newCall(req).execute().close()
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private fun ApiList.toModel() = ShoppingList(
        id = id,
        name = name,
        emoji = emoji ?: "🛒",
        items = items?.map { it.toModel() } ?: emptyList()
    )

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
