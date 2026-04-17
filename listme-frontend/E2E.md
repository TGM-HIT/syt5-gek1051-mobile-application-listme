# End-to-End (E2E) Testing mit Cypress

Diese Dokumentation beschreibt, wie die E2E-Tests für das ListMe-Frontend ausgeführt und verwaltet werden.

## Voraussetzungen

Bevor die Tests gestartet werden können, muss der Frontend-Entwicklungsserver laufen:

```powershell
cd listme-frontend
npm install
npm run dev
```

Standardmäßig wird erwartet, dass die App unter `http://localhost:5173` erreichbar ist (konfiguriert in `cypress.config.ts`).

## Testausführung

Es gibt zwei Möglichkeiten, die Tests auszuführen:

### 1. Cypress Test Runner (GUI)
Dies ist ideal während der Entwicklung, um Tests interaktiv in einem Browser zu verfolgen.

```powershell
cd listme-frontend
npm run cypress:open
```
*   Wählen Sie im Fenster **"E2E Testing"**.
*   Wählen Sie einen Browser (z.B. Chrome oder Electron).
*   Klicken Sie auf eine beliebige `.cy.ts` Datei, um den Test zu starten.

### 2. Headless Modus (Konsole)
Verwenden Sie diesen Befehl für eine schnelle Überprüfung aller Tests in der Konsole, z.B. für CI/CD.

```powershell
cd listme-frontend
npm run cypress:run
```

## Teststruktur & Abdeckung

Die Tests sind modular aufgebaut und orientieren sich an den Feature-IDs aus der `STORIES.md`. Für jedes Feature existiert eine eigene Testdatei im Verzeichnis `cypress/e2e/`.

### Übersicht der Testdateien

| Kategorie | Feature / ID | Testdatei |
| :--- | :--- | :--- |
| **Offline & Sync** | Offline-Modus (ID1) | `id1-offline.cy.ts` |
| | Konfliktmanagement (ID5) | `id5-conflict-management.cy.ts` |
| | Echtzeit-Sync (ID7) | `id7-realtime-sync.cy.ts` |
| | Bluetooth-Sync (ID24) | `id24-ble-sync.cy.ts` |
| **Listenverwaltung** | Listen CRUD (ID3) | `id3-lists-crud.cy.ts` |
| | Duplizieren (ID13) | `id13-list-duplication.cy.ts` |
| | Papierkorb (ID23) | `id23-trash.cy.ts` |
| **Artikel-Interaktion** | Check/Uncheck (ID2) | `id2-check-uncheck.cy.ts` |
| | Suche & Kategorien (ID4) | `id4-items-categories-search.cy.ts` |
| | Bearbeiten & Löschen (ID8) | `id8-items-edit-delete.cy.ts` |
| | Mengen & Labels (ID9) | `id9-items-metadata.cy.ts` |
| **Erweiterte Features** | Artikelbilder (ID10) | `id10-item-images.cy.ts` |
| | Favoriten & Bibliothek (ID11) | `id11-favorites.cy.ts` |
| | Budget & Kosten (ID14) | `id14-budget-costs.cy.ts` |

## Mocking Strategie

Um die Tests stabil und unabhängig vom Backend zu halten, wird `cy.intercept()` verwendet. 
*   **API-Mocking:** Alle Backend-Aufrufe (REST-API) werden abgefangen und mit vordefinierten JSON-Daten beantwortet.
*   **Status-Simulation:** Features wie der Offline-Modus werden durch Simulation der Browser-Konnektivität (`cy.stub(window.navigator, 'onLine')`) getestet.
*   **Echtzeit:** WebSocket-Events und Synchronisationsvorgänge werden innerhalb der Tests durch entsprechende UI-Zustandsänderungen verifiziert.
