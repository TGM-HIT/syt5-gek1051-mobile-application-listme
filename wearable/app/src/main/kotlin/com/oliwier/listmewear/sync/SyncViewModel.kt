package com.oliwier.listmewear.sync

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.oliwier.listmewear.api.ApiClient
import com.oliwier.listmewear.model.ShoppingList
import com.oliwier.listmewear.storage.LocalStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SyncViewModel(private val context: Context) : ViewModel() {

    private val api = ApiClient(context)
    private val storage = LocalStorage(context)

    private val _lists = MutableStateFlow<List<ShoppingList>>(emptyList())
    val lists: StateFlow<List<ShoppingList>> = _lists.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // Listen for Data Layer pushes from the phone
    private val listsUpdatedReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            _lists.value = storage.loadLists()
        }
    }

    // If we receive a sync token while running, immediately fetch via API
    private val tokenReceivedReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            refreshOnline()
        }
    }

    init {
        registerReceiver(listsUpdatedReceiver, CompanionSyncService.ACTION_LISTS_UPDATED)
        registerReceiver(tokenReceivedReceiver, CompanionSyncService.ACTION_TOKEN_RECEIVED)
        _lists.value = storage.loadLists()
        refreshOnline()
    }

    private fun registerReceiver(receiver: BroadcastReceiver, action: String) {
        val filter = IntentFilter(action)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
    }

    /** Pull fresh lists from the server (requires WiFi or LTE on the watch). */
    fun refreshOnline() {
        val online = isNetworkAvailable()
        _isOnline.value = online
        if (!online) return
        val syncToken = storage.getSyncToken() ?: return

        viewModelScope.launch {
            _isLoading.value = true
            try {
                val fetched = api.fetchListsViaSyncToken(syncToken)
                storage.saveLists(fetched)
                _lists.value = fetched
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Sync fehlgeschlagen"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Optimistically toggle an item locally, then sync to server if online.
     * If offline, the change is persisted locally and will sync next time
     * the phone app opens the list (via Data Layer).
     */
    fun checkItem(listId: String, itemId: String, checked: Boolean) {
        _lists.update { lists ->
            lists.map { list ->
                if (list.id != listId) list
                else list.copy(items = list.items.map { item ->
                    if (item.id == itemId) item.copy(checked = checked) else item
                })
            }
        }
        storage.saveLists(_lists.value)

        if (isNetworkAvailable()) {
            viewModelScope.launch {
                runCatching { api.checkItem(listId, itemId, checked) }
                // Failure is silently ignored — local state is already correct,
                // full sync on next refresh will reconcile via CRDT.
            }
        }
    }

    fun getList(listId: String): ShoppingList? = _lists.value.find { it.id == listId }

    private fun isNetworkAvailable(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val caps = cm.getNetworkCapabilities(cm.activeNetwork ?: return false) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onCleared() {
        super.onCleared()
        context.unregisterReceiver(listsUpdatedReceiver)
        context.unregisterReceiver(tokenReceivedReceiver)
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            SyncViewModel(context.applicationContext) as T
    }
}
