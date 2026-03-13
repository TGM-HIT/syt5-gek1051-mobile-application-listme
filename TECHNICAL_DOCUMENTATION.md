# Technische Dokumentation - ListMe

Diese Dokumentation beschreibt die technische Umsetzung der zentralen Funktionalitäten (User Stories) im Projekt **ListMe**. Der Fokus liegt auf der Architektur und den verwendeten Technologien.

---

## User Story #1: Offline-Zugriff und Datenpersistenz

Die Offline-Fähigkeit basiert auf einer **Offline-First-Strategie** unter Verwendung von **IndexedDB** (via `Dexie.js`) als lokalem Storage und einer **Operation Queue** zur Synchronisation.

- **Datenreplikation:** Der `CacheService` spiegelt alle serverseitigen Daten in der IndexedDB. Bei fehlender Konnektivität (erkannt via Axios Interceptors oder Catch-Blöcken) erfolgt der Lesezugriff transparent auf den lokalen Snapshot.
- **Optimistic Updates:** Mutationen werden sofort im lokalen Cache reflektiert und parallel in einer `OperationQueue` persistiert, um bei Wiederherstellung der Verbindung sequenziell abgearbeitet zu werden.

```typescript
// Auszug aus der Offline-Logik in useItemsStore.ts
if (isNetworkError(e)) {
  const item = { ...req, id: crypto.randomUUID(), checked: false };
  await CacheService.saveItem(item); // Lokale Persistenz
  await OperationQueue.enqueue({     // Queue für späteren Sync
    operationType: 'ITEM_CREATE',
    payload: { itemId: item.id, ... }
  });
}
```

---

## User Story #2: Artikel-Statusverwaltung (Check/Uncheck)

Die Statusänderung von Artikeln nutzt ein **Event-Sourcing-ähnliches Verfahren**. Jede Änderung erzeugt eine Operation, die sowohl den lokalen Zustand (`checked`-Flag im `itemsStore`) als auch den persistenten Speicher aktualisiert.

---

## User Story #3: Listen-Management (RESTful CRUD)

Die Verwaltung der Einkaufslisten erfolgt über einen klassischen **REST-Ansatz** im Spring Boot Backend (`ListController`).

- **Frontend-Integration:** Der `useListsStore` (Pinia) fungiert als Single Source of Truth und orchestriert API-Calls mit automatischen Cache-Updates.
- **Backend-Schicht:** Einsatz von Spring Data JPA zur Persistenzierung der Listen-Entitäten in einer relationalen Datenbank (PostgreSQL).

---

## User Story #4: Kategorisierung und Filter-Logik

Artikel sind über Fremdschlüssel-Beziehungen mit Kategorien verknüpft. 

- **Client-seitige Verarbeitung:** Die Filterung und Suche erfolgt performant im Frontend über Computed Properties innerhalb der Vue-Komponenten, um Latenzen bei der Benutzerinteraktion zu vermeiden.

---

## User Story #5: Konfliktauflösung (Vector Clocks & CRDT)

Um Schreibkonflikte bei Multi-User-Edits zu lösen, implementiert ListMe Mechanismen basierend auf **Vector Clocks** und **Last-Write-Wins (LWW)** innerhalb von CRDT-Strukturen.

- **Kausalität:** Jede Operation in der `OperationQueue` ist mit einer Vector Clock versehen, um die kausale Ordnung der Ereignisse über verschiedene Geräte hinweg zu bestimmen.

---

## User Story #6: Shared Lists via UUID-Einladung

Die Freigabe von Listen basiert auf einer **UUID-basierten Autorisierungsstrategie**. 

- **Routing:** Der Zugriff wird über dynamische Routen (`/list/:id`) gesteuert. Das Backend validiert die Berechtigung basierend auf der Listen-ID und dem Benutzerkontext.

---

## User Story #7: Echtzeit-Kommunikation (WebSockets)

Die Synchronisation zwischen aktiven Clients erfolgt über **WebSockets** mit dem **STOMP-Protokoll**.

- **Pub/Sub Modell:** Clients abonnieren Topics (`/topic/list/{listId}`). Bei Änderungen sendet der Server Broadcast-Messages an alle Subscriber der spezifischen Liste.
- **Backend-Integration:** Nutzung von `SimpMessagingTemplate` zur gezielten Verteilung von Status-Updates.

```java
@MessageMapping("/list/{listId}/update")
@SendTo("/topic/list/{listId}")
public UpdateMessage broadcastUpdate(@DestinationVariable String listId, UpdateMessage msg) {
    return msg; // Broadcast an alle verbundenen Teilnehmer
}
```

---

## User Story #8: Ressourcen-Manipulation (Update/Delete)

Die Bearbeitung und das Löschen von Ressourcen folgt dem einheitlichen Synchronisationsmuster: Lokale Ausführung -> Queueing -> Backend-Validierung -> Persistenz. Hierbei wird sichergestellt, dass auch gelöschte Elemente (Soft-Deletes) korrekt über alle Geräte hinweg synchronisiert werden.

---

## User Stories #9 - #24: Erweiterte Funktionalitäten

Technische Details zu Should-Have und Nice-to-Have Features (z.B. Push-Benachrichtigungen, Bildanalyse, Deep Links) werden sukzessive nach Abschluss der Kern-Implementierung ergänzt.
