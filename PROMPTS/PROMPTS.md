# AI-Prompt Dokumentation

Dieses Dokument listet alle wesentlichen Prompts auf, die während der Entwicklung von ListMe an Claude (Anthropic) gestellt wurden. Zweck: Transparenz und Nachvollziehbarkeit der AI-gestützten Entwicklung.

**Tool:** Claude Code (CLI), Modell: Claude Opus 4.6

---

## Phase 0 - Projekt-Setup

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

## Phase 1 - Datenbank & Identity

### Prompt 5: Phase 1 implementieren
> do phase 1 and tell me how to test it

Ergebnis: 4 Flyway-Migrationen, 13 JPA-Entities, 6 Repositories, Device-Identity-System (@CurrentDevice), ShareService, SyncTokenService, 4 Controller mit DTOs, 12 Integrationstests mit TestContainers. Mehrere Spring Boot 4 Breaking Changes mussten gefixt werden (Flyway-Starter, Jackson 3, AutoConfigureMockMvc Package-Änderung).

---

## Dokumentation

### Prompt 6: Stack-Beschreibung
> can you create a technical description of the stack in short bullet points such that it is realistic. also does frontend use the backend features now?

### Prompt 7: Vollständige Architektur
> tell me the FULL architecture, not just whats currently here

### Prompt 8: Technische Architektur (Deutsch)
> create a md file for technical architecture and explain them shortly and how to implement it approximately (in german) but make it short and not ai-like

Ergebnis: [technische-architektur.md](architecture/technische-architektur.md) - Überblick über Stack, Kernkonzepte (Device-Identity, Offline-First, CRDTs, Vector Clocks, Echtzeit-Sync), Datenfluss-Diagramme, Sharing/Sync-Flows.

### Prompt 9: Prompt-Dokumentation
> create a prompts.md file where you define all the prompts and shii so that the teacher doesnt say plagiat. Especially the last one with the technical.md
