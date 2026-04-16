package com.oliwier.listmewear.storage

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.oliwier.listmewear.model.ShoppingList

/**
 * Persists list data locally on the watch (SharedPreferences + Gson).
 * Enables fully offline shopping — no phone or WiFi needed in the store.
 */
class LocalStorage(context: Context) {
    private val prefs = context.getSharedPreferences("listme_data", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveLists(lists: List<ShoppingList>) {
        prefs.edit().putString("lists", gson.toJson(lists)).apply()
    }

    fun loadLists(): List<ShoppingList> {
        val json = prefs.getString("lists", null) ?: return emptyList()
        val type = object : TypeToken<List<ShoppingList>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveSyncToken(token: String) {
        prefs.edit().putString("sync_token", token).apply()
    }

    fun getSyncToken(): String? = prefs.getString("sync_token", null)

    fun saveServerUrl(url: String) {
        prefs.edit().putString("server_url", url).apply()
    }

    fun getServerUrl(): String =
        prefs.getString("server_url", "http://10.0.2.2:8080") ?: "http://10.0.2.2:8080"
}
