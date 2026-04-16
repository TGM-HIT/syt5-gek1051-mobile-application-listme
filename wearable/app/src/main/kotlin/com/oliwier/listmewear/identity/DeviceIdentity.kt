package com.oliwier.listmewear.identity

import android.content.Context
import java.util.UUID

/**
 * Generates and persists a stable deviceId for this watch.
 * Same concept as the frontend (IndexedDB UUID) — used for CRDT vector clocks
 * and the X-Device-Id header on every API request.
 */
object DeviceIdentity {
    private const val PREF_NAME = "listme_prefs"
    private const val KEY_DEVICE_ID = "device_id"

    fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_ID, null) ?: run {
            val id = UUID.randomUUID().toString()
            prefs.edit().putString(KEY_DEVICE_ID, id).apply()
            id
        }
    }
}
