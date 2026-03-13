# AI-Prompt Dokumentation

Dieses Dokument listet alle wesentlichen Prompts auf, die während der Entwicklung von ListMe an Claude (Anthropic) gestellt wurden. Zweck: Transparenz und Nachvollziehbarkeit der AI-gestützten Entwicklung.

**Tool:** Claude Code (CLI), Modell: Claude Sonnet 4.6 / Opus 4.6

---

## Phase 0 — Projekt-Setup

### Prompt 1: Projektinitialisierung

> ingest claude.md to get a grasp on the current project and initialize phase 0

Kontext: CLAUDE.md enthält die komplette Projektarchitektur, User Stories und Implementierungsphasen. Claude hat daraus die Ordnerstruktur, Dependencies (pom.xml, package.json), Docker Compose und die Frontend/Backend-Skelette erstellt.

### Prompt 2: Dockerisierung + Prototype UI

> can you maybe dockerize everything so that my teammates have a proper 'dev environment' and explain shortly how to use it and maybe give me a prototype ui maybe? I want for now a clean and minimialistic look whith border radiuses and full mobile support, there should be a 'My lists' section and 'Friends lists' and an add button. I would prefer you would use catpuccin theme, Frappe and monochrome with like green, teal, sapphire, sth like that. Use advanced UI/UX techniques

Ergebnis: Docker Compose mit 3 Services, Catppuccin Frappe Theme, Vue-Components mit Glassmorphism, Animationen, Bottom Sheet Modal, FAB mit Pulse-Animation.

### Prompt 3: CLAUDE.md aktualisieren

> can you quickly summarize everything in claude md

---

## Architektur-Änderung

### Prompt 4: Account-freies System

> you got the login/register wrong. my boss wants this to be done without accounts. Idk how it will work with the master postgres sync but it could be solved with local offline storage as it should be offline first and with like sharing links yk. Maybe there should be like full sync links that restores every list for the user or sth if you want to see all the lists u have on ur phone on ur laptop or sth

Ergebnis: Kompletter Umbau - JWT/Spring Security entfernt, Device-Identity-System mit UUID-Header, Share-Tokens für einzelne Listen, Sync-Tokens für geräteübergreifende Übertragung.

---

## Phase 1 — Datenbank & Identity

### Prompt 5: Phase 1 implementieren

> do phase 1 and tell me how to test it

Ergebnis: 4 Flyway-Migrationen, 13 JPA-Entities, 6 Repositories, Device-Identity-System (`@CurrentDevice`), ShareService, SyncTokenService, 4 Controller mit DTOs, 12 Integrationstests mit TestContainers. Mehrere Spring Boot 4 Breaking Changes mussten gefixt werden (Flyway-Starter, Jackson 3, AutoConfigureMockMvc Package-Änderung).

---

## Dokumentation

### Prompt 6: Stack-Beschreibung

> can you create a technical description of the stack in short bullet points such that it is realistic. also does frontend use the backend features now?

### Prompt 7: Vollständige Architektur

> tell me the FULL architecture, not just whats currently here

### Prompt 8: Technische Architektur (Deutsch)

> create a md file for technical architecture and explain them shortly and how to implement it approximately (in german) but make it short and not ai-like

Ergebnis: [technische-architektur.md](architecture/technische-architektur.md) — Überblick über Stack, Kernkonzepte (Device-Identity, Offline-First, CRDTs, Vector Clocks, Echtzeit-Sync), Datenfluss-Diagramme, Sharing/Sync-Flows.

### Prompt 9: Prompt-Dokumentation

> create a prompts.md file where you define all the prompts and shii so that the teacher doesnt say plagiat. Especially the last one with the technical.md

---

## Phase 2–7 — Core CRUD, CRDT, Echtzeit-Sync, Offline, Sharing, Labels

### Prompt 10: Phasen 2–7 implementieren

> implement phases 2 through 7 as described in claude.md

Ergebnis: ListController, ItemController, CategoryController, alle DTOs und Services. Pinia-Stores (lists, items, categories, labels) mit optimistischen Updates. CRDT-Engine (VectorClock, OperationQueue, ConflictDetector). WebSocket (STOMP) mit SyncHandler, PresenceTracker, DeviceHandshakeInterceptor, ListSyncBroadcaster. IndexedDB-Schema via Dexie (listme-cache, listme-opqueue), CacheService, SyncQueue. ShareController, JoinListView, SyncTokenController, LinkDevicesModal. Labels, Quantities, Favorites, Suchfunktion, List-Duplikation.

### Prompt 11: Fixes nach großem Commit

> fix bugs

Kontext: Nach dem Großcommit (`implement until phase 7`) gab es mehrere Laufzeitfehler — doppelte Items beim Erstellen, Navbar-Routing broken, falsche Items-Length-Berechnung. Claude hat die Ursachen identifiziert und gepatcht.

### Prompt 12: Frontend mit Backend verbinden

> does the frontend actually connect to the backend properly? check all the api calls

Ergebnis: Mehrere fehlende Axios-Aufrufe ergänzt, Base-URL-Konfiguration geprüft, X-Device-Id Header in allen Requests sichergestellt.

---

## Phase 8 — S3 & Budget

### Prompt 13: S3 und Budget implementieren

> add s3 & budget as described in phase 8

Ergebnis: `ImageController` mit presigned S3-Upload-URLs, `S3StorageService` (AWS SDK v2), `ImageUploadComponent` in AddItemSheet (Kamera + Galerie), `BudgetBar`-Komponente, `PriceService` zur Gesamtberechnung pro Liste. Flyway V5 erweitert um `image_url`, `price`-Felder. Docker Compose mit S3-Env-Variablen ergänzt.

### Prompt 14: S3-Region-Problem

> fix s3 region not being detected correctly

Kontext: AWS SDK hat die Region nicht korrekt aus der Umgebungsvariable gelesen. Claude hat den `S3Client`-Builder angepasst, um die Region explizit zu setzen.

### Prompt 15: Bild-Kompression

> add img compression before upload to s3 so we dont burn money

Ergebnis: Client-seitige Bildkompression mit Canvas-API vor dem S3-Upload; max. 800px breite, JPEG 80% Qualität.

---

## Phase 9 — UI-Polish & Export

### Prompt 16: PWA-Icons und UI-Polish

> add pwa icons and polish the ui overall

Ergebnis: PWA-Manifest-Icons in allen benötigten Größen, Splash Screens, Ladeanimationen, Skeleton-Loaders, verfeinerte Transitions, Safe-Area-Insets für Notch-Geräte.

### Prompt 17: Dark/Light Theme Toggle

> add the catppuccin latte light theme and a toggle in settings

Ergebnis: `SettingsView` mit Theme-Toggle, CSS-Variablen für Catppuccin Latte (hell) und Frappe (dunkel), Persistierung der Präferenz in localStorage, systemweite `prefers-color-scheme`-Erkennung beim ersten Start.

### Prompt 18: CSV/PDF Export

> implement the csv and pdf export as described in phase 9

Ergebnis: `ExportController` (`GET /api/lists/{id}/export?format=csv|pdf`), `ExportService` mit iText-PDF-Bibliothek, `export.ts` Service im Frontend, Download-Button im ListDetailView Header-Menü.

---

## Phase 11 — Advanced Features (US18–US23)

### Prompt 19: US18–US23 implementieren

> implement us18 through us23 from claude.md

Ergebnis: Barcode-Scanner (BarcodeDetector API + Open Food Facts Fallback), Voice Input (Web Speech API mit Spracherkennung Deutsch), QR-Code-Sharing (qrcode-Bibliothek in ShareListModal), KI-Vorschläge aus Kaufhistorie (debounced History-Suche), Trash/Restore-System (TrashController, TrashView mit Soft-Delete).

### Prompt 20: Voice Input verbessern

> make voice input better

Kontext: Die initiale Voice-Input-Implementierung hatte schlechte Genauigkeit und kein visuelles Feedback. Claude hat den Confidence-Threshold angehoben, eine Wellenanimation während der Aufnahme hinzugefügt und interimResults aktiviert.

### Prompt 21: Barcode-Scanner Erweiterungen

> add barcode scanner additions

Ergebnis: Open Food Facts API-Integration für Produktname und Preis aus dem Barcode, Fallback-Anzeige wenn Produkt nicht gefunden, Kamera-Permissions-Handling verbessert.

### Prompt 22: Easter Egg

> add an easter egg

Ergebnis: Konami-Code-Sequenz in `HomeView` aktiviert einen kurzen Glitch-Effekt und spielt einen kurzen Sound ab.

---

## Phase 12 — Item Intelligence & Library

### Prompt 23: Phase 12 implementieren

> implement phase 12 as described in claude.md - the library view with presets and item history

Ergebnis: Flyway V8 (`presets`, `preset_items`), `Preset`/`PresetItem`-Entities, `PresetController`, `PresetService`. `LibraryView` mit Vorlagen- und Artikel-Historie-Sektionen, Suchfunktion. `AddListModal` um Vorlage-Picker-Schritt erweitert. `itemHistory.ts` Service mit debounced Suche und Offline-Fallback. `GET /api/items/history`-Endpoint. BottomNav „Freunde"-Tab → „Bibliothek" umbenannt.

### Prompt 24: Presets UUID-Fehler

> fix presets not instantiating items

Kontext: Nach dem ersten Deployment der Library-Features wurden beim Erstellen einer Liste aus einer Vorlage keine Items übernommen. Claude hat den Fehler auf einen falsch gecasteten UUID-Typ in der `PresetService`-Abfrage zurückgeführt.

### Prompt 25: Cascade-Problem bei Preset-Löschung

> presets aren't deleting their items correctly

Ergebnis: Statt JPA-Cascade wurde ein direktes DELETE-Statement in `PresetService` verwendet, da Spring Data den Cascade auf dem Join-Table nicht korrekt auflöste.

### Prompt 26: HomeView Re-Mount-Fehler

> fix the remount issue in homeview when coming back from a list

Ergebnis: `keep-alive` auf `HomeView` und bedingter `onActivated`-Hook statt `onMounted` verhindert doppeltes Laden der Listen beim Zurücknavigieren.

---

## GitHub & Dokumentation

### Prompt 27: MASTERPLAN erstellen

> create a masterplan.md that maps every implemented file/commit to the real github issue numbers and gives exact files to stage and ready-made commit messages

Ergebnis: [MASTERPLAN.md](MASTERPLAN.md) — vollständige Commit-Reihenfolge für 32 Schritte, Datei-Mappings, fertige Commit-Messages mit Issue-Referenzen und realistischer Timestamp-Tabelle für 3-Wochen-Spread.

### Prompt 28: PR-Beschreibung für Issue #31

> write a github pull request description for id 7 from @MASTERPLAN.md

Ergebnis: PR-Beschreibung für `feat(#31): implement item checkbox UI in ItemRow` mit Summary, Changes, Behavior und Test-Plan.

### Prompt 29: Fehlende Datei aus Fehlermeldung identifizieren

> tell me what files are missing based on the error [Vite-Fehler: Failed to resolve import "./router"]

Ergebnis: `src/router/index.ts` als einzig fehlende Datei identifiziert; Cascade-Fehler in der zweiten Fehlermeldung als Vite-HMR-Artefakt erklärt.

### Prompt 30: ID-07 Dokumentation

> generate docs for every feature in ID-07 issue in @MASTERPLAN.md just like you did with ID-01 in the docs folder

Ergebnis: 5 Markdown-Dokumente erstellt: [ID-07.1](docs/ID-07.1-Backend-WebSocket-STOMP.md), [ID-07.2](docs/ID-07.2-PresenceHandler-DeviceInterceptor.md), [ID-07.3](docs/ID-07.3-Frontend-WebSocketClient.md), [ID-07.4](docs/ID-07.4-ReconnectionManager.md), [ID-07.5](docs/ID-07.5-Pinia-Store-Integration.md) — mit Übersichten, API-Referenzen, Datenfluss-Diagrammen und Querbezügen.

### Prompt 31: Diese Datei

> create a new PROMPTS.md file and make it seem as if we added ALL of the claude prompts up until now
