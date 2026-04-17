# ID-22 — Smartwatch App (Pixel Watch 3)

**Issue:** #22  
**Files:**
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/WearMainActivity.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/presentation/ListsScreen.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/presentation/ListDetailScreen.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/presentation/theme/WearTheme.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/sync/SyncViewModel.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/sync/CompanionSyncService.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/ble/BleGattServer.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/api/ApiClient.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/storage/LocalStorage.kt`
- `wearable/app/src/main/kotlin/com/oliwier/listmewear/identity/DeviceIdentity.kt`
- `listme-frontend/src/services/watchSync.ts`
- `listme-frontend/src/components/sync/WatchSyncModal.vue`
- `listme-frontend/src/views/SettingsView.vue`

---

## Overview

A standalone Wear OS app for the Pixel Watch 3 that lets users view and check off shopping list items without needing their phone nearby. The watch app is an independent client — it generates its own `deviceId`, registers with the backend, and communicates directly with the server over WiFi or LTE.

Initial setup is done once via a Bluetooth pairing flow in the PWA (Web Bluetooth API). After that the watch syncs autonomously.

---

## Architecture

Two sync paths exist in parallel:

```
┌──────────────────────────────────────────────────────────┐
│  Pixel Watch 3 (Wear OS 4)                               │
│                                                          │
│  WearMainActivity                                        │
│  ├── ListsScreen        — all lists with item counts     │
│  └── ListDetailScreen   — items, tap to check/uncheck    │
│                                                          │
│  SyncViewModel          — state + network coordination   │
│  LocalStorage           — offline cache (SharedPrefs)    │
│  BleGattServer          — receives initial pairing token │
└────────────┬─────────────────────┬───────────────────────┘
             │                     │
   Path A: Bluetooth         Path B: WiFi / LTE
   (initial setup only)      (ongoing sync)
             │                     │
    ┌────────▼──────┐    ┌─────────▼────────┐
    │  Phone PWA    │    │  ListMe Backend  │
    │  (Chrome)     │    │  REST API        │
    └───────────────┘    └──────────────────┘
```

### Path A — Initial pairing (Bluetooth)

Used once to link the watch to the user's lists:

1. User opens **Einstellungen → Uhr verknüpfen** in the PWA
2. `WatchSyncModal.vue` calls `shareService.createSyncToken()` → backend creates a sync token grouping all device lists
3. `watchSync.ts` uses the **Web Bluetooth API** to connect to the watch's GATT server
4. A JSON payload `{"token":"…","serverUrl":"…"}` is written to the `SYNC_TOKEN_CHAR` characteristic
5. `BleGattServer` on the watch receives the write, saves both values to `LocalStorage`
6. The watch immediately triggers an online refresh (Path B)

> Web Bluetooth requires Chrome and HTTPS (or localhost). The PWA sends the backend's base URL alongside the token so the watch knows where to connect.

### Path B — Ongoing sync (WiFi / LTE)

The watch fetches and posts directly to the ListMe REST API:

| Action | Endpoint |
|--------|----------|
| Initial list load | `POST /api/sync/{token}/apply` + `GET /api/lists/{id}/items` per list |
| Check/uncheck item | `PATCH /api/lists/{listId}/items/{itemId}/check` |

The watch uses the same `X-Device-Id` header as other clients. The backend auto-registers the device on first call (no separate registration step required).

---

## Components

### WearMainActivity

Entry point. Starts the BLE GATT server on launch and requests `BLUETOOTH_CONNECT` / `BLUETOOTH_ADVERTISE` permissions (Android 12+). Sets up Compose navigation between `ListsScreen` and `ListDetailScreen` using `SwipeDismissableNavHost` (swipe right to go back, standard Wear OS gesture).

### ListsScreen

Displays all synced lists in a `ScalingLazyColumn` (Wear OS scroll component that scales edge items for the round display). Each list shows its name, emoji, and how many items are still unchecked. An "Aktualisieren" chip at the bottom triggers a manual refresh.

Error and empty states are shown in place of the list — errors include the actual exception message to aid debugging.

### ListDetailScreen

Shows all items for a selected list. Unchecked items appear first; checked items slide to the bottom with strikethrough text.

Each item is a `ToggleChip` — tap to toggle. The state update is **optimistic**: the local `SyncViewModel` state is updated immediately for instant UI feedback, and the API call to the backend fires in the background. If the network call fails the local toggle stays (CRDT semantics — the next full sync will reconcile).

Recomposition is driven by `vm.lists.collectAsState()` so every toggle immediately updates the UI without waiting for a server response.

### SyncViewModel

Owns all list state as `StateFlow`. Key responsibilities:

- On init: loads cached lists from `LocalStorage`, attempts an online refresh
- Listens for `ACTION_TOKEN_RECEIVED` and `ACTION_LISTS_UPDATED` broadcasts from `BleGattServer` and `CompanionSyncService`
- `checkItem()`: applies optimistic local update → saves to `LocalStorage` → fires API call if network available
- `refreshOnline()`: checks for active WiFi/cellular, calls `ApiClient.fetchListsViaSyncToken()`, surfaces errors as human-readable strings in `_error` StateFlow

### CompanionSyncService

Extends `WearableListenerService` to receive data pushed from the phone's native Android app via the **Wearable Data Layer API** (Bluetooth, no internet required). Handles three paths:

| Path | Payload key | Action |
|------|-------------|--------|
| `/lists` | `lists_json` | Overwrites local list cache |
| `/sync_token` | `token` | Saves sync token, triggers refresh |
| `/server_url` | `url` | Updates stored backend URL |

This path is used when a native Android companion app is present. The BLE GATT path (above) is used when only the PWA is available.

### BleGattServer

A BLE GATT peripheral that the watch runs on startup. It advertises the ListMe service UUID (`0000FE9A-…`) so the phone's Chrome browser can find it via `navigator.bluetooth.requestDevice()`.

**Characteristics:**

| UUID | Properties | Purpose |
|------|-----------|---------|
| `0000FE9B-…` | Write | Receives sync token + server URL as JSON |
| `0000FE9C-…` | Read | Returns this watch's `deviceId` (pairing confirmation) |

### ApiClient

OkHttp-based REST client. Uses `HttpClientFactory` which is build-variant-specific:

- **Debug:** trust-all SSL (self-signed certs accepted — needed for local dev with HTTPS)
- **Release:** strict certificate validation

### LocalStorage

Thin wrapper over `SharedPreferences` + Gson. Persists the list cache, sync token, and server URL so the watch works fully offline (e.g. in a supermarket with no signal). Writes are synchronous (`apply()`) to avoid blocking the main thread.

### DeviceIdentity

Generates and persists a random UUID on first launch (`crypto.randomUUID()` equivalent via `UUID.randomUUID()`). Stored in SharedPreferences under key `device_id`. Sent as `X-Device-Id` on every API request — same identity model as the web frontend.

---

## PWA pairing flow

**File:** `listme-frontend/src/components/sync/WatchSyncModal.vue`  
**Service:** `listme-frontend/src/services/watchSync.ts`

The modal walks through four states: `idle → creating-token → waiting-ble → success/error`.

`getBluetoothSupportStatus()` in `watchSync.ts` distinguishes three failure reasons before attempting anything:

| Status | Cause |
|--------|-------|
| `not-secure` | Page loaded over HTTP on a non-localhost origin — `navigator.bluetooth` is unavailable even in Chrome |
| `not-chrome` | Browser doesn't implement Web Bluetooth (Firefox, Safari) |
| `supported` | Chrome on HTTPS or localhost — pairing can proceed |

The `VITE_WATCH_API_URL` env variable overrides the server URL sent to the watch. In development, set it to the dev machine's local IP and backend port (e.g. `http://192.168.1.42:8080`). In production it defaults to `window.location.origin`.

---

## Setup (first time)

### Build & install the watch app

```bash
cd wearable
./setup.sh           # generates Gradle wrapper (requires Gradle 8.13 or Android Studio)
./gradlew installDebug
```

Or open the `wearable/` folder in Android Studio and run on a connected Pixel Watch 3 (enable ADB debugging in the watch's developer options).

### Pair with the PWA

1. Open the ListMe PWA in **Chrome** on Android (HTTPS or localhost)
2. Go to **Einstellungen → Smartwatch → Verbinden**
3. Make sure the ListMe watch app is open in the foreground
4. Select the watch in the Bluetooth device picker
5. The watch fetches all lists automatically

### Development: connect to local backend

Create `listme-frontend/.env.local`:

```
VITE_WATCH_API_URL=http://192.168.1.42:8080
```

Replace `192.168.1.42` with your machine's LAN IP (`ip addr show | grep "inet "`). The watch and dev machine must be on the same WiFi network.

---

## Edge cases

- **No WiFi/LTE on watch:** Lists load from `LocalStorage` cache. Checked items are persisted locally and synced on next successful API call.
- **Pairing on HTTP (local IP):** `isWebBluetoothSupported()` returns `not-secure`; modal shows an explanation with the exact reason.
- **Self-signed HTTPS cert (dev):** Debug build uses a trust-all OkHttp client. Release build enforces certificate validation.
- **Token expired:** The sync token has a 30-day TTL on the backend. If `POST /api/sync/{token}/apply` fails with 410, `SyncViewModel` surfaces the error message on the watch display. Re-pair from the PWA to generate a new token.
- **Watch app not in foreground during pairing:** BLE GATT server is started in `onCreate` and stopped in `onDestroy`. If the app is not running, the service UUID won't be advertised and the phone's BLE scan will find nothing.

---

## Manual verification

1. **List display**
   - Pair watch, ensure WiFi is active
   - Expect: all lists from the PWA appear on the watch within a few seconds

2. **Check item**
   - Open a list on the watch, tap an unchecked item
   - Expect: item immediately shows strikethrough + moves toward the bottom
   - Open the same list on the PWA — expect item shown as checked

3. **Uncheck item**
   - Tap a checked item on the watch
   - Expect: item moves back to the top, strikethrough removed

4. **Offline shopping**
   - Disable WiFi on the watch after lists have loaded
   - Expect: lists remain visible, tapping items still toggles them locally
   - Re-enable WiFi → expect changes to sync to backend

5. **Pairing error — wrong browser**
   - Open Einstellungen → Uhr verknüpfen in Firefox
   - Expect: warning "Web Bluetooth wird nur in Chrome unterstützt" shown, button disabled

6. **Pairing error — HTTP**
   - Access PWA over `http://192.168.x.x:5173`
   - Expect: warning about HTTPS requirement, button disabled

---

## Cross-links

- [ID-07.1 — Backend WebSocket/STOMP](ID-07.1-Backend-WebSocket-STOMP.md)
- [ID-06.1 — Invite code generation](ID-6.1_invite_code_generation.md)
- [architecture.md](architecture.md)
