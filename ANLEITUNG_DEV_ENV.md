# ListMe – Entwicklungsumgebung einrichten

## Voraussetzungen

Ihr braucht nur **Docker Desktop** installiert. Nichts sonst – kein Java, kein Node, kein Maven lokal.

- [Docker Desktop herunterladen](https://www.docker.com/products/docker-desktop/)
- Docker muss laufen (Taskleisten-Icon aktiv)

---

## Setup in 2 Befehlen

```bash
git clone <repo-url>
cd listme
docker compose up
```

Beim ersten Start werden alle Dependencies heruntergeladen (Maven, npm packages). Das dauert **3–5 Minuten**. Danach startet es in ~30 Sekunden.

---

## Dienste

| Dienst     | URL                       | Beschreibung                        |
|------------|---------------------------|-------------------------------------|
| Frontend   | http://localhost:5173     | Vue 3 App, hot-reload aktiv         |
| Backend    | http://localhost:8080     | Spring Boot REST API                |
| PostgreSQL | localhost:5432            | Datenbank (user/pass/db: `listme`)  |

---

## Workflow

**Frontend-Änderungen** werden automatisch im Browser neu geladen (Vite HMR) – einfach speichern, Browser aktualisiert sich.

**Backend-Änderungen** erfordern einen Neustart:
```bash
docker compose restart backend
```

**Logs live anschauen:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Alles stoppen:**
```bash
docker compose down
```

**Komplett neu starten** (z.B. nach Datenbankproblemen):
```bash
docker compose down -v   # löscht auch Volumes/Daten
docker compose up
```

---

## Was ist schon drin?

### Datenbank (PostgreSQL 16)

Schema wird automatisch via **Flyway** eingespielt – ihr müsst nichts manuell anlegen.

| Migration | Inhalt |
|-----------|--------|
| V1        | Kerntabellen: `devices`, `lists`, `items`, `list_devices` |
| V2        | CRDT-Tabellen: `crdt_operations`, `vector_clock_entries` |
| V3        | `labels`, `categories`, Zuordnungstabellen |
| V4        | `favorites`, `share_tokens`, `sync_tokens`, `sync_token_lists`, `images` |

### Backend (Spring Boot 4.0.2 / Java 17)

Paketstruktur unter `com.oliwier.listmebackend`:

| Paket        | Inhalt |
|--------------|--------|
| `api/`       | Controller + DTOs: `DeviceController`, `ListController`, `ShareController`, `SyncTokenController` |
| `domain/`    | JPA-Entities (`Device`, `ShoppingList`, `Item`, etc.), Repositories, Services |
| `identity/`  | `@CurrentDevice`-Annotation + `DeviceArgumentResolver` (liest `X-Device-Id`-Header) |
| `config/`    | CORS, Web-Konfiguration |
| `crdt/`      | (leer, kommt in Phase 3) |
| `websocket/` | (leer, kommt in Phase 4) |

**Wichtig:** Keine Spring Security, kein Login, kein JWT. Geräte identifizieren sich über einen `X-Device-Id`-Header (UUID, wird im Frontend in IndexedDB generiert).

### Frontend (Vue 3 + TypeScript)

| Ordner              | Inhalt |
|---------------------|--------|
| `src/views/`        | `HomeView.vue` – Startseite mit "Meine Listen" / "Geteilt mit mir" |
| `src/components/`   | `AppHeader`, `BottomNav`, `FloatingActionButton`, `ListCard`, `AddListModal` |
| `src/router/`       | Vue Router Setup |
| `src/types/`        | TypeScript-Typdefinitionen |
| `src/stores/`       | Pinia Stores (noch leer, kommen in Phase 2) |
| `src/services/`     | API/WebSocket-Services (noch leer) |
| `src/crdt/`         | CRDT-Logik Client-seitig (noch leer, kommt in Phase 3) |

Design: **Catppuccin Frappe** Theme, Tailwind CSS 4, mobile-first.

---

## Häufige Probleme

**Port bereits belegt:**
```bash
# Prüfen was auf Port 8080 läuft
netstat -ano | findstr :8080
```
Oder in `docker-compose.yml` den Port anpassen.

**Backend startet nicht (DB nicht bereit):**
Docker wartet automatisch bis PostgreSQL healthy ist. Falls es trotzdem crasht:
```bash
docker compose restart backend
```

**npm-Fehler im Frontend:**
```bash
docker compose down -v
docker compose up   # installiert node_modules neu
```

---

## Nächste Schritte (Phase 2)

Aktuell laufen Phase 0 (Setup) und Phase 1 (DB-Schema, Device Identity, Share/Sync-APIs) bereits. Phase 2 beinhaltet die eigentliche List/Item-CRUD-Logik und die Frontend-Views dafür.

Schaut in `CLAUDE.md` für die vollständige Phasenbeschreibung und Architekturdetails.
