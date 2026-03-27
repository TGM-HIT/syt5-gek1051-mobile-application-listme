# 6.2 Andere Benutzer können mithilfe des Codes beitreten

> **Kontext:** Teil von User Story ID 6 – Gemeinsames Einkaufen über Einladungscodes.

## Übersicht
Benutzer können über einen Einladungscode oder den entsprechenden Link einer Einkaufsliste beitreten, um gemeinsam mit anderen daran zu arbeiten.

## Beitrittsprozess

### 1. Token-Vorschau
Bevor ein Benutzer der Liste beitritt, zeigt das Frontend Informationen über die Liste an, um sicherzustellen, dass es die richtige ist.
- **Endpoint**: `GET /api/share/{token}`
- **Rückgabe**: Name der Liste und optional das Emoji.

### 2. Beitritt bestätigen
Wenn der Benutzer auf "Liste beitreten" tippt, wird der Beitritt vollzogen.
- **Endpoint**: `POST /api/share/{token}/join`
- **Backend-Logik**: 
  - Der Server sucht die Liste anhand des Tokens (`ShareService.findByShareToken`).
  - Das `deviceId` des beitretenden Geräts wird in der `list_devices` Tabelle mit der `listId` verknüpft.
  - Die Liste wird für das neue Gerät in der Datenbank freigeschaltet.

### 3. Automatische Synchronisation
Nach dem Beitritt führt das Frontend folgende Schritte aus:
- **Navigation**: Der Benutzer wird direkt in die Detailansicht der Liste weitergeleitet.
- **WebSocket-Abonnement**: Das Gerät abonniert das Topic `/topic/list/{id}`, um Änderungen ab sofort in Echtzeit zu empfangen.

## UX-Highlights
- **Nahtlos**: Der Beitritt erfolgt ohne Registrierung oder Login, rein über die Geräte-Identität.
- **Direkt**: Bei Klick auf einen Freigabelink öffnet sich die App (oder PWA) direkt an der Beitritts-Seite.

---
*Referenz: [architecture.md](architecture.md#4-user-stories-features)*