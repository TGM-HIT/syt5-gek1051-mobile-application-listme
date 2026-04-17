package com.oliwier.listmewear.ble

import java.util.UUID

object BleConstants {
    // ListMe BLE service (from project architecture)
    val SERVICE_UUID: UUID = UUID.fromString("0000FE9A-0000-1000-8000-00805F9B34FB")

    // Write the sync token here from the PWA (phone Chrome → watch)
    val SYNC_TOKEN_CHAR_UUID: UUID = UUID.fromString("0000FE9B-0000-1000-8000-00805F9B34FB")

    // Read the watch's own deviceId (useful for debugging / pairing confirmation)
    val DEVICE_ID_CHAR_UUID: UUID = UUID.fromString("0000FE9C-0000-1000-8000-00805F9B34FB")
}
