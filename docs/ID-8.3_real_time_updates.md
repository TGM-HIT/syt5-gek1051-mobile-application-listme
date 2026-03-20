# 8.3 Änderungen werden direkt in der Einkaufsliste übernommen

> **Kontext:** Teil von User Story ID 8 – Artikel bearbeiten und löschen.

## Übersicht
ListMe stellt sicher, dass alle Änderungen an Artikeln sofort auf allen Geräten der Teilnehmer sichtbar sind. Dies wird durch eine Kombination aus optimistischem UI und Echtzeit-Broadcasting erreicht.

## Mechanismen der direkten Übernahme

### 1. Optimistisches UI (Lokales Gerät)
Wenn ein Benutzer einen Artikel bearbeitet oder löscht, aktualisiert die App den lokalen Pinia-Store (`itemsStore`) sofort, noch während der API-Aufruf im Hintergrund läuft. Dies vermittelt dem Benutzer ein flüssiges und verzögerungsfreies Erlebnis.

### 2. Echtzeit-Broadcasting (Andere Geräte)
- Sobald der Server die Änderung verarbeitet hat, sendet er eine `CrdtOperationResponse` an alle anderen verbundenen Geräte der Liste via WebSockets.
- Der Client auf diesen Geräten empfängt die Nachricht und ruft die `applyOp()`-Funktion auf, die den lokalen Store direkt aktualisiert.

### 3. Synchronisation nach Wiederverbindung
Falls ein Gerät während einer Änderung offline war:
- Die Änderung wird lokal in der `OperationQueue` (IndexedDB) gespeichert.
- Sobald das Gerät wieder online geht, wird die Queue geflusht (`useSyncQueue.flushQueue()`), und alle Änderungen werden auf den Server übertragen und von dort aus weiterverteilt.

## Deduplizierung
Um zu verhindern, dass die eigene Änderung noch einmal vom Server zurückkommt und das UI flackert, wird jede Operation mit der `deviceId` des Erstellers markiert. Das sendende Gerät ignoriert seine eigenen vom Server zurückgespiegelten Nachrichten.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*