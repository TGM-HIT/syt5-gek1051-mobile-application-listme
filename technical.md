# Technische Architektur - ListMe

## Überblick

Offline-first Einkaufslisten-App mit CRDT-basierter Synchronisation. Mehrere Geräte können gleichzeitig (auch offline) dieselbe Liste bearbeiten - Konflikte werden automatisch aufgelöst. Keine Accounts, keine Passwörter.

---

## Stack

### Backend
- **Spring Boot 4.0.2** (Java 17, Maven) - REST API + WebSocket Server
- **PostgreSQL 16** - Persistenz (kein Computed-Logic in der DB, nur Speicher)
- **Flyway** - Datenbank-Migrationen (V1-V4 stehen)
- **WebSocket (STOMP)** - Echtzeit-Sync zwischen Clients
- **S3** - Bildupload (später)

### Frontend
- **Vue 3** + TypeScript, Vite, Pinia (State Management)
- **Yjs** - Client-seitige CRDT-Operationen
- **IndexedDB (Dexie.js)** - Offline-Speicher + Operationsqueue
- **PWA** - Service Worker, Background Sync, installierbar
- **Tailwind CSS 4** - Catppuccin Frappe Theme

### Mobile & Wearable
- **Capacitor** - Vue-App als native iOS/Android-App
- **Wear OS** (Java, Jetpack Compose) - Smartwatch-App
- **Flutter BLE Bridge** - Bluetooth-Sync ohne Internet

### Infrastruktur
- **Docker Compose** - Dev-Umgebung (PostgreSQL + Backend + Frontend)
- **AWS Lightsail** - Hosting (später)
- **Terraform** - Infrastructure-as-Code
- **GitHub Actions** - CI/CD

---

## Kernkonzepte

### 1. Geräte-Identität (kein Login)

Jedes Gerät bekommt eine zufällige UUID. Die wird im `X-Device-Id` Header mitgeschickt. Backend erstellt das Device automatisch beim ersten Request.

Listen teilen geht über **Share-Tokens** (12-stellige Links). Cross-Device-Sync (z.B. Handy -> Laptop) über **Sync-Tokens** (24-stellig, 30 Tage gültig).

**Umsetzung:** `@CurrentDevice`-Annotation am Controller-Parameter, `DeviceArgumentResolver` liest den Header und ruft `DeviceService.getOrCreate()` auf. Steht alles unter `identity/`.

### 2. Offline-First

Der Client schreibt Änderungen sofort in IndexedDB und zeigt sie an. Wenn online, werden die Operationen per WebSocket an den Server geschickt. Wenn offline, landen sie in einer Queue und werden beim Reconnect geflushed.

**Umsetzung:** Dexie.js-Schema für Lists/Items/Operations/SyncQueue. `useOffline`-Composable überwacht den Online-Status. Service Worker cached Assets und macht Background Sync.

### 3. CRDTs (Conflict-Free Replicated Data Types)

Statt klassischer Konflikte ("wer hat zuletzt gespeichert?") benutzen wir mathematische Datenstrukturen, die automatisch mergen:

| CRDT | Wofür | Regel |
|------|-------|-------|
| **RGA** (Replicated Growable Array) | Item-Reihenfolge | Gleichzeitige Inserts werden deterministisch sortiert |
| **LWW-Register** (Last-Write-Wins) | Item-Properties (Name, checked, ...) | Neuerer Timestamp gewinnt, bei Gleichstand: höhere Device-ID |
| **OR-Set** (Observed-Remove Set) | Teilnehmer einer Liste | Add schlägt Remove (wenn gleichzeitig) |
| **PN-Counter** | Likes/Votes | Jedes Gerät hat eigenen Zähler, Summe = Gesamtwert |

**Umsetzung Backend:** Eigene Java-Klassen unter `crdt/` - `VectorClock`, `RGA`, `LWWRegister`, `ORSet`. Der `SyncEngine`-Service nimmt Operationen entgegen, erkennt Konflikte und merged.

**Umsetzung Frontend:** Yjs-Wrapper (`YjsDocument`) für Y.Doc/Y.Array/Y.Map. TypeScript-VectorClock mit identischer Logik wie Backend.

### 4. Vector Clocks

Jede Operation hat einen Vector Clock: `{deviceA: 5, deviceB: 3}` - ein Zähler pro Gerät.

Damit erkennt man Kausalität:
- `{A:5, B:3}` vs `{A:4, B:4}` = **CONCURRENT** (Konflikt, CRDT löst auf)
- `{A:5, B:3}` vs `{A:5, B:2}` = **AFTER** (kein Konflikt)

Die CRDTs lösen den Konflikt auf, die Vector Clocks erkennen ihn nur.

**Umsetzung:** `vector_clocks`-Tabelle (list_id, device_id, counter). `crdt_operations`-Tabelle speichert jede Operation mit JSONB-Payload und dem zugehörigen Vector Clock.

### 5. Echtzeit-Sync

WebSocket mit STOMP-Protokoll. Client subscribed auf `/topic/list/{id}`, Server broadcasted Änderungen an alle Teilnehmer.

**Umsetzung:** `WebSocketConfig` (STOMP Endpoints), `SyncHandler` (Operationen empfangen/broadcasten), `PresenceHandler` (wer ist gerade online), `AuthChannelInterceptor` (Device-ID validieren beim Connect). Frontend: STOMP.js Client mit exponential Backoff Reconnect.

### 6. Datenbank

PostgreSQL speichert nur - die ganze CRDT-Logik läuft in der Applikation.

Wichtige Tabellen:
- `devices` - UUID, Display-Name
- `lists` - Name, Emoji, Share-Token
- `items` - Name, checked, Position, Kategorie
- `list_devices` - Welches Gerät hat Zugriff (mit Rolle)
- `crdt_operations` - Jede einzelne Operation (JSONB)
- `vector_clocks` - Aktueller Stand pro Liste/Gerät

---
