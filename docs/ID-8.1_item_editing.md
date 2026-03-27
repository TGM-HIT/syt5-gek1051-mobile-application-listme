# 8.1 Artikel können bearbeitet werden

> **Kontext:** Teil von User Story ID 8 – Artikel bearbeiten und löschen.

## Übersicht
Benutzer können Details eines Artikels (Name, Menge, Kategorie, Preis usw.) jederzeit ändern. Diese Änderungen werden über CRDTs synchronisiert, um Konflikte zu vermeiden.

## Bearbeitungs-Flow

### 1. Aktion im Frontend
- Der Benutzer tippt auf einen Artikel oder öffnet die Detail-Ansicht.
- Nach dem Speichern wird ein `PUT /api/lists/{listId}/items/{itemId}` an den Server gesendet.

### 2. Verarbeitung im Backend (`ItemService.update`)
- **Zugriffsprüfung**: Der Server prüft, ob das Gerät berechtigt ist (`requireAccess`).
- **Datenbank-Update**: Das bestehende `Item`-Objekt wird mit den neuen Werten aktualisiert.
- **CRDT-Log**: Die `SyncEngine` erstellt eine neue Operation vom Typ `ITEM_UPDATE`. Diese enthält:
  - `itemId`
  - Neue Werte (z.B. der geänderte Name)
  - Einen Zeitstempel für das **Last-Write-Wins (LWW)**-Prinzip.
- **Broadcast**: Die Operation wird über WebSockets an alle anderen Teilnehmer der Liste gesendet.

### 3. Konfliktlösung (LWW-Register)
Sollten zwei Benutzer gleichzeitig denselben Artikel bearbeiten, vergleicht das System die Zeitstempel der jeweiligen Operationen. Die Operation mit dem aktuelleren Zeitstempel setzt sich durch.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*