<img width="150" height="150" alt="logo_no_bg_1" src="https://github.com/user-attachments/assets/13e9342e-0ec6-4e78-a5fc-cd70eab52e8e" />

# ListMe

**[list-me.net](https://list-me.net)**

**Offline-first collaborative shopping lists.**
Multiple people can edit the same list simultaneously — even without internet — and changes merge automatically without conflicts.

No accounts. No passwords. Open the app and start.

---

## Team

| Name | Role |
|------|------|
| Alexander Hiroma Friedrichkeit | Product Owner (PO) |
| Oliwier Przewlocki | Technical Architect (TA) |
| Laurin Schieder | Developer A |
| Pavle Petrovic | Developer B |

---

## What it does

- **Offline-first** — works with zero connectivity; syncs automatically when back online
- **Real-time collaboration** — changes from other devices appear instantly via WebSocket
- **No accounts** — each device gets a random UUID; share lists via a link
- **CRDT-based sync** — concurrent edits from multiple devices merge without conflicts
- **PWA** — installable on Android and iOS directly from the browser

---

## Quick start

```bash
git clone <repo> && cd listme
docker compose up
```

| Service    | URL                    |
|------------|------------------------|
| Frontend   | http://localhost:5173  |
| Backend    | http://localhost:8080  |
| PostgreSQL | localhost:5432         |

**Requirements:** Docker Desktop (that's it — no local Java or Node needed).

Frontend hot-reloads on save. After changing Java code, run:

```bash
docker compose restart backend
```

---

## Documentation

| Document | What's in it |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Core concepts: device identity, offline-first pattern, CRDTs, vector clocks, WebSocket sync |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Tech stack, dev setup, codebase map, DB schema, API reference, data flows, testing |
| [CLAUDE.md](CLAUDE.md) | Full implementation plan, user stories, phase breakdown |

---

## Tech stack (short version)

**Backend:** Spring Boot 4.0.2 · Java 17 · PostgreSQL 16 · WebSocket/STOMP · Flyway
**Frontend:** Vue 3 · TypeScript · Vite · Pinia · Dexie (IndexedDB) · Tailwind CSS 4 · PWA
**Infra:** Docker · AWS Lightsail · GitHub Actions
