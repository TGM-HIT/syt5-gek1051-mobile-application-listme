# 6.3 Berechtigungen sind korrekt gesetzt (nur eingeladene Benutzer)

> **Kontext:** Teil von User Story ID 6 – Gemeinsames Einkaufen über Einladungscodes.

## Übersicht
ListMe implementiert ein striktes Berechtigungsmodell (Access Control), um sicherzustellen, dass nur autorisierte Geräte Zugriff auf eine Einkaufsliste haben.

## Berechtigungsprüfung

### Backend-Sicherheit
- **X-Device-Id Header**: Bei jeder REST-Anfrage wird die Geräte-ID des anfragenden Geräts im Header mitgesendet.
- **Berechtigungs-Check**: Bevor eine Operation ausgeführt wird (z. B. Artikel hinzufügen, bearbeiten oder Liste löschen), prüft das Backend, ob das Gerät als Teilnehmer in der `list_devices` Tabelle für die jeweilige `listId` eingetragen ist.
- **Implementierung**: `ShareController.getListForDevice` oder `ItemService.requireAccess` führen diese Prüfung durch.
- **Fehlerbehandlung**: Wenn keine Berechtigung vorliegt, antwortet der Server mit `403 Forbidden`.

### WebSocket-Sicherheit
- **Abonnement-Schutz**: Wenn ein Client versucht, ein Topic wie `/topic/list/{listId}` zu abonnieren, prüft der Server, ob die `deviceId` (mitgegeben beim Verbindungsaufbau) berechtigt ist, Updates für diese Liste zu empfangen.

## Datensichtbarkeit
- **Exklusivität**: Ein Gerät sieht nur die Listen, zu denen es entweder durch eigene Erstellung oder durch Beitritt via Token hinzugefügt wurde.
- **Filterung**: Alle Abfragen (z. B. `GET /api/lists`) geben nur die Einträge zurück, bei denen das Gerät autorisiert ist.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*