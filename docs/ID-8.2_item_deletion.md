# 8.2 Artikel können gelöscht werden

> **Kontext:** Teil von User Story ID 8 – Artikel bearbeiten und löschen.

## Übersicht
Benutzer können Artikel aus der Einkaufsliste löschen. ListMe verwendet ein Soft-Delete-Modell, um eine nahtlose Synchronisation und die Wiederherstellung von Artikeln zu ermöglichen.

## Lösch-Mechanismus

### Soft-Delete (Papierkorb)
- **Aktion**: Ein Artikel wird über `DELETE /api/lists/{listId}/items/{itemId}` gelöscht.
- **Backend**: Der Server setzt ein `deleted_at`-Feld auf den aktuellen Zeitstempel. Der Artikel bleibt physisch in der Datenbank, wird aber in der aktiven Liste ausgeblendet.
- **Vorteil**: Ein Soft-Delete ist CRDT-freundlich. Es verhindert Probleme bei gleichzeitigen Operationen auf demselben Artikel.

### Permanentes Löschen
- Artikel im Papierkorb können über `DELETE /api/lists/{listId}/items/{itemId}/permanent` endgültig entfernt werden. Diese Aktion ist unwiderruflich.

### Wiederherstellung
- Über den `PATCH /restore`-Endpoint kann ein Artikel aus dem Papierkorb zurück in die aktive Liste verschoben werden (durch Leeren des `deleted_at`-Felds).

## CRDT-Synchronisation
- Jedes Löschen löst eine `ITEM_DELETE`-Operation aus, die an alle verbundenen Geräte gesendet wird.
- Wenn Gerät A einen Artikel löscht, während Gerät B ihn gleichzeitig bearbeitet, wird der Artikel am Ende gelöscht, da Löschoperationen im System Priorität haben oder durch den Zeitstempel im LWW-Modell entschieden werden.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*