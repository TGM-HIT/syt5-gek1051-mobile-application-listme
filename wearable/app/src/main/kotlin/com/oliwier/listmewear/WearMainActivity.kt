package com.oliwier.listmewear

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.oliwier.listmewear.ble.BleGattServer
import com.oliwier.listmewear.presentation.ListDetailScreen
import com.oliwier.listmewear.presentation.ListsScreen
import com.oliwier.listmewear.presentation.theme.ListMeWearTheme
import com.oliwier.listmewear.sync.CompanionSyncService

class WearMainActivity : ComponentActivity() {

    private lateinit var bleServer: BleGattServer

    private val blePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { granted ->
        if (granted.values.all { it }) bleServer.start()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        bleServer = BleGattServer(applicationContext) { token ->
            // Token received via BLE → trigger a WiFi/LTE refresh
            sendBroadcast(android.content.Intent(CompanionSyncService.ACTION_TOKEN_RECEIVED))
        }
        startBleServer()

        setContent {
            ListMeWearTheme {
                WearApp()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        bleServer.stop()
    }

    private fun startBleServer() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val needed = listOf(Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE)
                .filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
            if (needed.isEmpty()) bleServer.start() else blePermissionLauncher.launch(needed.toTypedArray())
        } else {
            bleServer.start()
        }
    }
}

@Composable
private fun WearApp() {
    val navController = rememberSwipeDismissableNavController()

    SwipeDismissableNavHost(
        navController = navController,
        startDestination = "lists"
    ) {
        composable("lists") {
            ListsScreen(onListClick = { listId -> navController.navigate("list/$listId") })
        }
        composable(
            route = "list/{listId}",
            arguments = listOf(navArgument("listId") { type = NavType.StringType })
        ) { backStack ->
            val listId = backStack.arguments?.getString("listId") ?: return@composable
            ListDetailScreen(listId = listId, onBack = { navController.popBackStack() })
        }
    }
}
