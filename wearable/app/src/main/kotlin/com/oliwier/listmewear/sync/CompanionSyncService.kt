package com.oliwier.listmewear.sync

import android.content.Intent
import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.oliwier.listmewear.model.ShoppingList
import com.oliwier.listmewear.storage.LocalStorage

/**
 * Receives data pushed from the phone app via the Wearable Data Layer API (Bluetooth).
 *
 * The phone app sends:
 *   /lists        → JSON array of all ShoppingLists (full refresh)
 *   /sync_token   → the sync token so the watch can also fetch via WiFi/LTE
 *   /server_url   → the backend base URL (optional, for custom deployments)
 *
 * When data arrives the service saves it to LocalStorage and broadcasts
 * ACTION_LISTS_UPDATED so the active ViewModel can refresh the UI.
 */
class CompanionSyncService : WearableListenerService() {

    private val gson = Gson()

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        val storage = LocalStorage(applicationContext)
        dataEvents.forEach { event ->
            if (event.type != DataEvent.TYPE_CHANGED) return@forEach
            val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap

            when (event.dataItem.uri.path) {
                "/lists" -> {
                    val json = dataMap.getString("lists_json") ?: return@forEach
                    val type = object : TypeToken<List<ShoppingList>>() {}.type
                    val lists: List<ShoppingList> = gson.fromJson(json, type) ?: return@forEach
                    storage.saveLists(lists)
                    Log.d(TAG, "Received ${lists.size} lists from phone via Data Layer")
                    sendBroadcast(Intent(ACTION_LISTS_UPDATED))
                }
                "/sync_token" -> {
                    val token = dataMap.getString("token") ?: return@forEach
                    storage.saveSyncToken(token)
                    Log.d(TAG, "Received sync token from phone")
                    // Trigger a WiFi/LTE refresh now that we have a token
                    sendBroadcast(Intent(ACTION_TOKEN_RECEIVED))
                }
                "/server_url" -> {
                    val url = dataMap.getString("url") ?: return@forEach
                    storage.saveServerUrl(url)
                    Log.d(TAG, "Server URL updated: $url")
                }
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "Message from phone: ${messageEvent.path}")
    }

    companion object {
        private const val TAG = "CompanionSyncService"
        const val ACTION_LISTS_UPDATED = "com.oliwier.listmewear.LISTS_UPDATED"
        const val ACTION_TOKEN_RECEIVED = "com.oliwier.listmewear.TOKEN_RECEIVED"
    }
}
