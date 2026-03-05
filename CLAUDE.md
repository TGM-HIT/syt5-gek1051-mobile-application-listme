# ListMe - Project Architecture & Implementation Guide

## Project Overview

**ListMe** is an offline-first collaborative shopping list application with CRDT-based conflict-free replication enabling seamless multi-user synchronization across web, mobile, and wearable devices.

**Core Principle:** Application-layer CRDTs + Vector Clocks for deterministic conflict resolution, allowing offline edits that automatically merge when reconnecting.

---

## Current State

**Phase 0 complete.** Dev environment fully dockerized, both skeletons compile, prototype UI running.

### Dev Environment (for teammates)

```bash
git clone <repo> && cd listme
docker compose up        # starts all 3 services
```

| Service      | URL                    | Container          |
|-------------- |------------------------|---------------------|
| Frontend     | http://localhost:5173  | node:20-alpine      |
| Backend      | http://localhost:8080  | maven:3.9-temurin-17|
| PostgreSQL   | localhost:5432         | postgres:16-alpine  |

- Source is volume-mounted: frontend hot-reloads via Vite HMR, backend needs `docker compose restart backend`
- Maven + node_modules cached in named Docker volumes for fast restarts
- Production Dockerfiles exist in each module (multi-stage builds, nginx for frontend)

### What's Implemented

- **Backend:** Spring Boot skeleton with all dependencies (JPA, Flyway, WebSocket, JWT, Security, Validation, TestContainers), application.properties configured with DB/JWT/Flyway settings, package structure created (config, api, websocket, domain, crdt, security, notification, storage, util), Flyway migration dir ready
- **Frontend:** Vue 3 + TS prototype with Catppuccin Frappe theme (monochrome + green/teal/sapphire accents), Pinia + Vue Router + Axios + Dexie + Yjs + STOMP.js installed, Tailwind CSS 4, PWA via vite-plugin-pwa, Vitest configured
- **Prototype UI:** HomeView with "My Lists" / "Shared with me" sections, ListCard with progress bars + participant avatars + accent colors, glassmorphism AppHeader, BottomNav, FloatingActionButton with pulse animation, AddListModal bottom sheet with emoji picker, staggered fade-up animations, mobile-first responsive layout, safe area insets, reduced-motion support
- **Docker:** Full dev docker-compose (postgres + backend + frontend), production Dockerfiles + nginx.conf
- **Docs:** architecture/, api/, development/ directories created

### Next Up: Phase 1 (Database & Schema)

Flyway migrations, JPA entities, device identity, share/sync token system

---

## Technology Stack (Actual)

### Backend

Spring Boot 4.0.2 (Java 17), Maven 3.9, PostgreSQL 16, WebSocket (STOMP), Flyway, Bean Validation, Lombok, TestContainers (no auth — account-free architecture)

### Frontend

Vue 3.5 (Composition API + TypeScript 5.9), Vite 7, Pinia 3, Vue Router 4, Yjs, IndexedDB (Dexie 4), Axios, STOMP.js, PWA (vite-plugin-pwa), Tailwind CSS 4, Vitest 4, Inter font, Catppuccin Frappe theme

### Mobile & Wearable

Capacitor (iOS/Android), Native Wear OS (Java, Jetpack Compose), Flutter BLE bridge

### Infrastructure

AWS Lightsail, Docker, Terraform, GitHub Actions, CloudFront, SNS (FCM/APNs)

---

## Core Architecture

### 0. Account-Free Identity

**No accounts, no login, no passwords.** The app works instantly on first open.

**Device Identity:** Each browser/device generates a random `deviceId` (UUID) stored in IndexedDB. This ID is used for vector clocks and CRDT operations.

**Sharing a list (share token):**
1. User taps "Share" → list + CRDT state uploaded to server
2. Server stores it, returns a share link: `listme.app/s/Xk9mP2`
3. Anyone with the link gets the list in their IndexedDB
4. All devices with the link sync in real-time via WebSocket

**Cross-device full sync (sync token):**
1. User taps "Link my devices" → all their list IDs grouped under a sync token
2. Server returns a sync link: `listme.app/sync/Abc123Xyz...`
3. Open on another device → all lists pulled down + stored locally
4. Both devices stay synced going forward via server relay

**Server's role:** Relay + backup only. Stores shared/synced lists and CRDT operations. No user accounts.

**Database model:**
- `devices` — deviceId (PK), created_at
- `lists` — listId (PK), share_token (unique, nullable), created_by_device
- `list_devices` — which devices have access to which lists
- `sync_tokens` — token (PK), created_by_device, groups multiple lists for cross-device transfer
- `sync_token_lists` — maps sync tokens to list IDs

### 1. Offline-First Pattern

User action → Immediate UI update → CRDT operation with vector clock → IndexedDB → [online] WebSocket to server → Broadcast to clients | [offline] Queue for sync

### 2. Application-Layer CRDTs

**Frontend:** Yjs for client-side CRDT operations
**Backend:** Custom Java implementation

**Types:**

- RGA (Replicated Growable Array) - item ordering
- LWW-Register (Last-Write-Wins) - item properties
- OR-Set (Observed-Remove Set) - participants
- PN-Counter - likes/votes

**Why Application Layer:** Semantic understanding, simpler database ops, full control, better observability

### 3. Vector Clocks

**Purpose:** Causality tracking to detect concurrent operations

**Structure:** `{deviceA: 5, deviceB: 3}` - counters per device

**Integration:** Each CRDT operation = `{data, vectorClock, deviceId, timestamp}`

- Vector clocks DETECT conflicts (BEFORE/AFTER/CONCURRENT)
- CRDTs RESOLVE conflicts (merge rules)

### 4. Real-Time Sync

WebSocket (STOMP) for bidirectional communication, sub-second latency, battery efficient

### 5. Database Role

PostgreSQL as **persistence layer only** (NOT computation)

- Stores: `devices`, `lists`, `list_devices`, `items`, `share_tokens`, `sync_tokens`, `crdt_operations` (JSONB), `vector_clocks`
- Application does: CRDT merging, conflict detection, vector clock comparison

---

## User Stories → Priority Groups

### MUST HAVE (MH) - Core Functionality

- US01: Offline access (IndexedDB, ServiceWorker, SyncQueue)
- US02: Check/uncheck items (ItemCheckbox, LWW-Register)
- US03: CRUD lists (ListController, ListService, ListsView)
- US04: Items with categories + search (CategoryService, SearchComponent)
- US05: Conflict display + notifications (ConflictDetector, ConflictBanner, NotificationService)
- US06: Share via link (ShareController, ShareModal, share tokens)
- US07: Real-time sync (WebSocket, SyncHandler, PresenceHandler)
- US08: Edit/delete items (ItemController, ItemEditor)

### SHOULD HAVE (SH) - Enhanced Features

- US09: Quantities/units + labels (QuantityInput, LabelManager)
- US10: Item images (ImageUpload, S3 storage)
- US11: Favorites (FavoriteController, FavoritesList)
- US12: Remove participants (ParticipantController, OR-Set)
- US13: Duplicate lists (ListService clone method)
- US14: Prices + budget (PriceService, BudgetView)
- US15: Dark mode (Theme toggle, CSS variables)
- US16: Export CSV/PDF (ExportService, PDF generation)
- US17: ~~REMOVED~~ (no accounts — account-free architecture)
- US25: Cross-device sync via sync token/link (SyncTokenController, LinkDevicesModal)

### NICE TO HAVE (N2H) - Advanced Features

- US18: Barcode scan (Camera API, Barcode library)
- US19: Voice input (Web Speech API, VoiceRecorder)
- US20: QR code sharing (QR generator)
- US21: AI suggestions (ML model, purchase history analysis)
- US22: Smartwatch app (Wear OS, CompanionSync)
- US23: Trash/restore (Soft delete, RestoreService)
- US24: BLE sync (Flutter bridge, Bluetooth LE)

---

## Repository Structure

```
listme/
├── listme-backend/             # Spring Boot 4.0.2 (Maven)
│   ├── src/main/java/com/oliwier/listmebackend/
│   │   ├── config/            # Security, WebSocket, CORS
│   │   ├── api/               # Controllers, DTOs, Mappers
│   │   ├── websocket/         # Handlers, Messages
│   │   ├── domain/            # model/, repository/, service/
│   │   ├── crdt/              # VectorClock, Operations, Structures, Merge, Sync
│   │   ├── identity/           # Device identity, share tokens, sync tokens
│   │   ├── notification/      # FCM, APNs
│   │   ├── storage/           # S3 for images
│   │   └── util/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/      # Flyway
│   ├── src/test/java/
│   ├── pom.xml, Dockerfile
│   └── mvnw, mvnw.cmd
│
├── listme-frontend/            # Vue 3 + TypeScript
│   ├── src/
│   │   ├── components/        # common/, list/, item/, label/, conflict/, sync/
│   │   ├── views/             # HomeView, etc.
│   │   ├── stores/            # Pinia stores
│   │   ├── crdt/              # YjsDocument, VectorClock, ConflictDetector
│   │   ├── services/          # api, websocket, storage, notification
│   │   ├── composables/
│   │   ├── router/, types/, utils/, workers/
│   │   └── assets/
│   ├── package.json, vite.config.ts, vitest.config.ts
│   ├── Dockerfile, nginx.conf
│   └── index.html
│
├── mobile/                     # Capacitor (future)
├── wearable/                   # Wear OS (future)
├── ble-sync-bridge/            # Flutter (future)
├── shared/                     # API contracts (future)
├── docs/                       # architecture/, api/, development/
├── scripts/
├── infrastructure/             # Terraform, Docker
├── .github/workflows/
├── docker-compose.yml          # Full dev environment
├── .gitignore
└── CLAUDE.md
```

---

## Implementation Phases

### Phase 0: Project Setup

**Goal:** Repository structure, dev environment, infrastructure

**Tasks:**

1. Initialize repo with all folders
2. Backend: Spring Initializr, `build.gradle` (Spring Boot, PostgreSQL, WebSocket, JWT, Flyway), `application.yml` (profiles)
3. Frontend: Vite + Vue + TS, install deps (router, pinia, yjs, axios, dexie, capacitor, tailwind), configs
4. Docker: `docker-compose.yml` with PostgreSQL 16
5. Docs: Create architecture, API, development folders

**Deliverable:** Clean repo, runnable skeletons, local PostgreSQL

---

### Phase 1: Database & Device Identity

**Goal:** Schema, device identity, share/sync token system

**Tasks:**

1. Flyway migrations: V1 (devices, lists, items, list_devices), V2 (vector_clocks, crdt_operations), V3 (labels, categories), V4 (favorites, share_tokens, sync_tokens, sync_token_lists, images)
2. JPA entities for all tables
3. Spring Data repositories
4. `DeviceController`: auto-register device on first API call (deviceId from header)
5. `ShareController`: generate share token for a list, join list via token
6. `SyncTokenController`: create sync token grouping all device's lists, resolve token to list set
7. Simple `SecurityConfig`: CORS, rate limiting (no auth filters — all endpoints open, gated by token knowledge)
8. Tests: Repository integration (TestContainers)

**Deliverable:** Database schema complete, device identity working, share/sync token APIs functional

---

### Phase 2: Core CRUD

**Goal:** List and item management

**Tasks:**

1. `ListController` + `ListService`: create, read, update, delete, share (US03)
2. `ItemController` + `ItemService`: add, update, check/uncheck, delete (US02, US08)
3. `CategoryController` + `CategoryService`: CRUD categories, assign to items (US04 partial)
4. DTOs, mappers, validation
5. Frontend: `ListsView`, `ListDetailView`, `ItemRow`, `ItemEditor` components
6. Pinia stores: `lists`, `items`, `categories`
7. API service layer in frontend
8. Tests: Controller integration tests, service unit tests

**Deliverable:** US02, US03, US08 complete, US04 partial

---

### Phase 3: CRDT Engine

**Goal:** Conflict-free replication foundation

**Backend Tasks:**

1. `VectorClock` class: increment, merge, compare methods
2. `CrdtOperation` model with vector clock field
3. CRDT structures: `RGA`, `LWWRegister`, `ORSet`, `PNCounter`
4. `ConflictDetector`: compare vector clocks, identify concurrent ops
5. `MergeStrategy`: implement merge logic for each CRDT type
6. `SyncEngine`: process operations, detect conflicts, apply merges, update DB
7. Repositories: save/query operations and vector clocks
8. Critical tests: commutativity, associativity, idempotence, convergence

**Frontend Tasks:**

1. `YjsDocument` wrapper: Y.Doc, Y.Array, Y.Map
2. `VectorClock` TypeScript class (same logic as backend)
3. `CrdtSync` service: send/receive operations
4. `OperationQueue`: queue offline ops in IndexedDB
5. `ConflictDetector` client-side
6. CRDT merge tests, convergence tests

**Deliverable:** CRDT foundation, operations stored with vector clocks, merge logic working

---

### Phase 4: Real-Time Sync

**Goal:** WebSocket collaborative editing

**Backend Tasks:**

1. `WebSocketConfig`: enable STOMP, configure endpoints
2. `SyncHandler`: receive operations, broadcast updates
3. `PresenceHandler`: track online users
4. `ConflictNotificationHandler`: broadcast conflicts
5. `DeviceChannelInterceptor`: identify device on connect via deviceId header
6. Integration tests

**Frontend Tasks:**

1. `WebSocketClient`: STOMP.js, connect/disconnect
2. `SyncProtocol`: send operations, handle updates
3. `PresenceProtocol`: join/leave, display online users
4. `ReconnectionManager`: auto-reconnect exponential backoff
5. Integrate with Pinia stores
6. Connection tests

**Deliverable:** US07 complete (real-time sync), presence indicators

---

### Phase 5: Offline Support

**Goal:** Full offline functionality + PWA

**Tasks:**

1. IndexedDB schema (Dexie): lists, items, operations, vectorClocks, syncQueue
2. `CacheService`: save/retrieve from IndexedDB
3. `SyncQueue`: queue offline ops, flush when online
4. Service Worker: cache assets, background sync
5. `vite-plugin-pwa`: manifest, icons, SW generation
6. `useOffline` composable: monitor online/offline
7. `OfflineBanner` component
8. E2E offline tests (Playwright network throttling)

**Deliverable:** US01 complete (offline access), PWA installable

---

### Phase 6: Sharing, Sync Links & Conflicts

**Goal:** Collaboration features, cross-device sync

**Tasks:**

1. `ShareListModal` component: generate share link, copy to clipboard (US06)
2. `JoinListView` component: open share link → add list to local device (US06)
3. `LinkDevicesModal` component: generate sync token → QR/link for cross-device full sync (US25)
4. `ParticipantController`: list participants, remove (US12)
5. `ParticipantManager` component with OR-Set CRDT
6. `ConflictBanner` component: display detected conflicts (US05)
7. `ConflictResolutionModal`: show concurrent changes, merge options
8. Push notifications setup: FCM (Android), APNs (iOS)
9. `NotificationService`: send conflict alerts (US05)

**Deliverable:** US05, US06, US12, US25 complete

---

### Phase 7: Enhanced Features

**Goal:** Quantities, labels, favorites, search

**Tasks:**

1. Quantities/units: update `Item` model, `ItemQuantity` component (US09)
2. Labels: `LabelController`, `LabelService`, `LabelManager`, `LabelTag` components (US09)
3. Categories + search: extend `CategoryService`, `SearchBar` component, search API (US04 complete)
4. Favorites: `FavoriteController`, `FavoritesList`, quick-add functionality (US11)
5. Duplicate lists: `ListService.duplicate()` method (US13)
6. Tests for all new features

**Deliverable:** US04, US09, US11, US13 complete

---

### Phase 8: Images & Budget

**Goal:** Visual aids, cost tracking

**Tasks:**

1. S3 setup (Terraform), image upload API
2. `ImageUploadController`, S3 service, image processing
3. `ItemImageUpload` component, camera/gallery integration (US10)
4. Prices: update `Item` model, `ItemPrice` component
5. `BudgetController`, `PriceService`: calculate totals
6. `BudgetView` component: estimated costs per list (US14)
7. Tests

**Deliverable:** US10, US14 complete

---

### Phase 9: UX Polish

**Goal:** Theme, export, polish

**Tasks:**

1. Dark mode: CSS variables, theme toggle, persist preference (US15)
2. Export: `ExportController`, CSV/PDF generation libraries (US16)
3. UI polish: animations, loading states, error handling
4. Accessibility: ARIA labels, keyboard navigation
5. Performance optimization

**Deliverable:** US15, US16 complete

---

### Phase 10: Mobile & Wearable

**Goal:** Cross-platform apps

**Tasks:**

1. Capacitor: configure Android/Android, build scripts
2. Native plugins: Bluetooth LE, push notifications
3. Wear OS: `WearMainActivity`, list/item screens
4. `CompanionSyncService`: sync with phone via Data Layer API
5. Watch face complications
6. App store builds (APK, IPA)

**Deliverable:** Mobile apps functional, US22 complete (Pixel Watch)

---

### Phase 11: Advanced

**Goal:** N2H features

**Priority order:**

1. Barcode scan: camera permission, barcode library (US18)
2. Voice input: Web Speech API, `VoiceRecorder` component (US19)
3. QR code sharing: QR generator library (US20)
4. Trash/restore: soft delete, `TrashService`, restore UI (US23)
5. BLE sync: Flutter bridge app, Bluetooth LE protocol (US24)
6. AI suggestions: purchase history analysis, ML model (US21)

**Deliverable:** N2H features based on time available

---

### Phase 12: Item Intelligence & Library

**Goal:** Smart item input from history, a dedicated Library view replacing the unused "Freunde" tab,
and list presets for quick list creation. No BLE or accounts required.

---

#### BottomNav change
The "Freunde" tab (`id: 'friends'`, currently disabled, `to: null`) becomes the **"Bibliothek"** tab:
- New label: `Bibliothek`, new icon: `library` (books/grid), route: `/library`
- The "Favoriten" tab can stay disabled for now or be removed in this phase — decide at implementation time

---

#### Part 1 — Item Autocomplete (inline, while typing in AddItemSheet)

The US21 smart suggestions introduced in Phase 11 are good but read from the Pinia in-memory store only.
Phase 12 upgrades this with a proper persistent history:

- **Backend:** New `GET /api/items/history?q=<prefix>&limit=8` endpoint — queries the `items` table for
  `DISTINCT ON (lower(name))` rows belonging to the current device, ordered by `MAX(created_at) DESC`.
  Returns: `name`, `quantityUnit`, `price`, `imageUrl`
- **Frontend service:** `itemHistoryService.search(q)` — debounced (200 ms), falls back to Pinia store
  scan (current US21 logic) when offline
- **Replace** the current computed `suggestions` in `AddItemSheet` with the new service call
- Selecting a suggestion fills: name, quantityUnit, price, imageUrl (same as now)

---

#### Part 2 — Library View (`/library`)

A full-page view accessed via the "Bibliothek" BottomNav tab.

**Sections:**
1. **Meine Artikel** — deduplicated item history, sorted by use count descending
   - Each card: thumbnail (if any), name, typical unit + price, use count badge
   - Tap → opens `AddItemSheet` pre-filled on the current list (if navigated from a list), or just shows
     item detail if opened standalone
   - Long-press / swipe → delete from history

2. **Vorlagen** (Presets) — saved list templates
   - Each card: emoji, name, item count
   - Tap → create a new list from this preset (pre-populates all items)
   - Swipe to delete, tap ··· to rename/edit items in preset

**Search bar** at the top filters both sections simultaneously.

**"Aus Bibliothek" button** in `AddItemSheet` (next to the barcode button) deep-links directly into the
library view in "picker mode" — selecting an item fills the sheet and closes the library overlay.

---

#### Part 3 — List Presets

**Backend:**
- Flyway `V8__presets.sql`: `presets (id, name, emoji, created_by_device, created_at)` +
  `preset_items (id, preset_id, name, quantity, quantity_unit, price, image_url, position)`
- `PresetController`: `GET /api/presets`, `POST /api/presets`, `DELETE /api/presets/{id}`,
  `GET /api/presets/{id}/items`
- `PresetService`: save + load preset items
- `ListService`: extend `createList()` to accept optional `presetId` → copies preset items into new list

**Frontend:**
- `presetService.ts`: CRUD wrappers
- Presets section in `LibraryView.vue` (see Part 2)
- `AddListModal`: add optional "Von Vorlage starten" picker step (shown after name/emoji entry)
- "Als Vorlage speichern" in `ListDetailView` header menu → POST /api/presets with current items

---

#### Implementation Order

1. `BottomNav.vue` — rename Freunde → Bibliothek, point to `/library`
2. `router/index.ts` — add `/library` route → `LibraryView`, `meta: { hideChrome: false }`
3. Backend: `V8__presets.sql`, `Preset`/`PresetItem` entities, `PresetController`, `PresetService`
4. Backend: `GET /api/items/history` endpoint in `ItemController`
5. `services/itemHistory.ts` — debounced search with offline fallback
6. `AddItemSheet.vue` — replace inline suggestions with history service; add "Aus Bibliothek" button
7. `LibraryView.vue` — history section + presets section + search
8. `AddListModal.vue` — preset picker step
9. `ListDetailView.vue` — "Als Vorlage speichern" option

---

**Deliverable:** "Bibliothek" tab live; fast item re-entry from history; preset-based list creation

---

### Phase 13: Production Prep (Week 14)

**Goal:** Deployment readiness

**Tasks:**

1. Terraform: provision Lightsail instances, databases, S3, CloudFront
2. Docker: multi-stage builds, production `docker-compose.yml`
3. CI/CD: GitHub Actions (test, build, deploy)
4. Monitoring: CloudWatch, logging, error tracking
5. Performance: load testing (JMeter), optimization
6. Security: penetration testing, dependency audits
7. Documentation: API docs, deployment guide, user manual
8. Beta testing: invite users, collect feedback

**Deliverable:** Production deployment, monitoring active

---

## Critical Implementation Notes

### Vector Clock Implementation

Backend and frontend MUST maintain identical vector clock logic. Test with property-based tests ensuring commutativity, associativity, idempotence.

### CRDT Merge Rules

- RGA: Concurrent inserts → deterministic ordering by element ID
- LWW: Concurrent updates → tie-break by timestamp, then deviceId
- OR-Set: Concurrent add/remove → add wins (observed-remove semantics)

### Offline Queue Management

Operations queued in IndexedDB MUST include full vector clock. On reconnect, send in timestamp order. Handle duplicate detection on server.

### Conflict UI (US05)

Show conflicts ONLY when vector clocks indicate CONCURRENT operations. Display both values, allow user choice or automatic merge. Log all conflicts for audit.

### Testing Strategy

- Backend: Unit (JUnit), Integration (TestContainers), CRDT properties
- Frontend: Unit (Vitest), E2E (Playwright with offline simulation)
- Critical: Test "split-brain" scenario (two offline users, concurrent edits, reconnect)

### Performance Targets

- Sync latency: <500ms (95th percentile)
- Offline operations: Store 10,000+ ops in IndexedDB
- WebSocket connections: Support 1,000+ concurrent users per instance
- CRDT merge: <100ms for 1,000 operations

### Security Checklist

- Share tokens: cryptographically random, unguessable (min 12 chars)
- Sync tokens: longer tokens (min 24 chars), optionally paired with a passphrase
- Rate limiting: 100 req/min per device IP
- Input validation: Bean Validation (JSR 380)
- CORS: Whitelist specific origins
- SQL injection: Parameterized queries only
- XSS: CSP headers, sanitize user input
- No accounts = no passwords = no credential storage liability

BLE (Bluetooth Low Energy) Integration - US24
User Story 24: "Als Benutzer möchte ich über Bluetooth Low Energy (BLE) auf geteilte Einkaufslisten zugreifen können, auch ohne Internetverbindung, damit ich mit anderen in der Nähe zusammenarbeite."
Architecture for BLE Sync
Problem: Two users in a store with poor/no cellular connection need to sync their shared list
Solution: Device-to-device sync via Bluetooth LE with relay pattern
[Device A - Offline] <--BLE--> [Device B - Has Internet] <--HTTPS--> [Server]
OR
[Device A - Offline] <--BLE--> [Device B - Offline] (peer-to-peer CRDT sync)
Components

1. Flutter BLE Sync Bridge App (ble-sync-bridge/)
   Purpose: Standalone utility app that acts as BLE relay
   Key Features:

Scans for nearby ListMe devices via BLE advertising
Receives CRDT operations from offline devices
Relays to server when internet available
Stores operations locally if both devices offline
Syncs peer-to-peer using CRDTs directly

Technologies:

Flutter 3.16 (cross-platform iOS/Android)
flutter_blue_plus plugin for BLE
Local SQLite for operation queue
Background service to keep running

BLE Protocol:

GATT Service UUID: 0000FE9A-0000-1000-8000-00805F9B34FB (custom ListMe service)
Characteristics:

operations (notify, write) - CRDT operations transfer
vectorClock (read) - current vector clock state
deviceInfo (read) - device ID, user ID
syncStatus (notify) - sync progress updates

---

## Success Criteria

**MVP (End of Week 7):**
All MH user stories (US01-US08) complete, offline-first working, real-time sync operational

**Full Release (End of Week 11):**
All MH + SH user stories complete, mobile apps deployed, production-ready

**Extended Release (End of Week 14):**
N2H features, Wear OS app, BLE sync, production deployed with monitoring
