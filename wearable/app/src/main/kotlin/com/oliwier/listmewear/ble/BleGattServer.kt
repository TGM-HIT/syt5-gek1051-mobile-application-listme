package com.oliwier.listmewear.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import com.oliwier.listmewear.identity.DeviceIdentity
import com.oliwier.listmewear.storage.LocalStorage
import org.json.JSONObject

/**
 * BLE GATT peripheral server running on the watch.
 *
 * Advertises the ListMe service UUID so the phone's Chrome browser
 * can discover and connect to it via the Web Bluetooth API.
 *
 * Accepted writes:
 *   SYNC_TOKEN_CHAR → saves the sync token, triggers WiFi/LTE fetch
 *
 * Readable characteristics:
 *   DEVICE_ID_CHAR  → returns this watch's deviceId (confirmation for the user)
 */
@SuppressLint("MissingPermission")
class BleGattServer(
    private val context: Context,
    private val onSyncTokenReceived: (token: String) -> Unit
) {
    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

    private var gattServer: BluetoothGattServer? = null

    private val gattCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            val state = if (newState == BluetoothProfile.STATE_CONNECTED) "connected" else "disconnected"
            Log.d(TAG, "Device ${device.address} $state")
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice, requestId: Int, offset: Int,
            characteristic: BluetoothGattCharacteristic
        ) {
            if (characteristic.uuid == BleConstants.DEVICE_ID_CHAR_UUID) {
                val id = DeviceIdentity.getDeviceId(context).toByteArray(Charsets.UTF_8)
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, id)
            } else {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice, requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean, responseNeeded: Boolean,
            offset: Int, value: ByteArray
        ) {
            if (characteristic.uuid == BleConstants.SYNC_TOKEN_CHAR_UUID) {
                val raw = String(value, Charsets.UTF_8).trim()
                val storage = LocalStorage(context)
                // Payload is JSON: {"token":"...","serverUrl":"..."}
                try {
                    val json = JSONObject(raw)
                    val token = json.getString("token")
                    val serverUrl = json.optString("serverUrl").takeIf { it.isNotBlank() }
                    if (serverUrl != null) storage.saveServerUrl(serverUrl)
                    storage.saveSyncToken(token)
                    Log.d(TAG, "Received sync token via BLE, serverUrl=$serverUrl")
                    onSyncTokenReceived(token)
                } catch (e: Exception) {
                    // Fallback: plain token string (backwards compat)
                    storage.saveSyncToken(raw)
                    Log.d(TAG, "Received plain sync token via BLE")
                    onSyncTokenReceived(raw)
                }
            }
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            }
        }
    }

    fun start() {
        val adapter = bluetoothManager.adapter ?: run {
            Log.w(TAG, "No Bluetooth adapter")
            return
        }
        if (!adapter.isEnabled) {
            Log.w(TAG, "Bluetooth disabled")
            return
        }

        gattServer = bluetoothManager.openGattServer(context, gattCallback)?.also { server ->
            server.addService(buildGattService())
            Log.d(TAG, "GATT server opened")
        }

        adapter.bluetoothLeAdvertiser?.startAdvertising(
            AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
                .setConnectable(true)
                .setTimeout(0)  // advertise until stop() is called
                .build(),
            AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .addServiceUuid(ParcelUuid(BleConstants.SERVICE_UUID))
                .build(),
            object : AdvertiseCallback() {
                override fun onStartSuccess(s: AdvertiseSettings) { Log.d(TAG, "BLE advertising started") }
                override fun onStartFailure(e: Int) { Log.e(TAG, "BLE advertising failed: $e") }
            }
        )
    }

    fun stop() {
        bluetoothManager.adapter?.bluetoothLeAdvertiser?.stopAdvertising(object : AdvertiseCallback() {})
        gattServer?.close()
        gattServer = null
        Log.d(TAG, "BLE GATT server stopped")
    }

    private fun buildGattService() =
        BluetoothGattService(BleConstants.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
            // Write: receive sync token from phone PWA
            addCharacteristic(
                BluetoothGattCharacteristic(
                    BleConstants.SYNC_TOKEN_CHAR_UUID,
                    BluetoothGattCharacteristic.PROPERTY_WRITE,
                    BluetoothGattCharacteristic.PERMISSION_WRITE
                )
            )
            // Read: expose watch deviceId for pairing confirmation
            addCharacteristic(
                BluetoothGattCharacteristic(
                    BleConstants.DEVICE_ID_CHAR_UUID,
                    BluetoothGattCharacteristic.PROPERTY_READ,
                    BluetoothGattCharacteristic.PERMISSION_READ
                )
            )
        }

    companion object {
        private const val TAG = "BleGattServer"
    }
}
