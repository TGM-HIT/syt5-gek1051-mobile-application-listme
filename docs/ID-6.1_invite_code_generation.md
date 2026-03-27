# 6.1 Einladungscode kann generiert werden

> **Kontext:** Teil von User Story ID 6 – Gemeinsames Einkaufen über Einladungscodes.

## Übersicht
Um eine Einkaufsliste mit anderen zu teilen, kann ein Teilnehmer einen eindeutigen Einladungscode generieren. Dieser Code dient als temporärer Schlüssel, um den Zugriff auf die Liste zu ermöglichen.

## Technische Implementierung

### Backend-Prozess
1. **Generierung**: Der `ShareService` im Backend nutzt einen sicheren Zufallsgenerator (`SecureRandom`), um einen 12-stelligen alphanumerischen String zu erzeugen.
2. **Speicherung**: Der Token wird direkt im Feld `share_token` des `ShoppingList`-Modells in der Datenbank gespeichert.
3. **API-Endpoint**: 
   - `POST /api/lists/{listId}/share`
   - Antwortet mit dem generierten Code, der `listId` und dem Namen der Liste.

### Frontend-Ablauf
- Der Benutzer tippt in der Listen-Detailansicht auf "Teilen".
- Das Frontend ruft den Share-Endpoint auf.
- Der erhaltene Code wird dem Benutzer angezeigt (oft als Teil eines Links: `listme.app/s/{token}`).

## Sicherheitsmerkmale
- **Entropie**: 12 Zeichen bieten ausreichend Schutz gegen Brute-Force-Angriffe.
- **Revozierung**: Über `DELETE /api/lists/{listId}/share` kann der aktuelle Code ungültig gemacht werden, was den Beitritt für neue Benutzer über diesen Code sofort unterbindet.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*