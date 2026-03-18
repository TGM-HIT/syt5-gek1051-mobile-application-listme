<img width="150" height="150" alt="logo_no_bg_1" src="https://github.com/user-attachments/assets/13e9342e-0ec6-4e78-a5fc-cd70eab52e8e" />

# ListMe

**[list-me.net](https://list-me.net)**

**Offline-first collaborative shopping lists.**
Multiple people can edit the same list simultaneously — even without internet — and changes merge automatically without conflicts.

No accounts. No passwords. Open the app and start.

---

<!-- CI/CD -->
[![Backend CI](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/frontend-ci.yml)
[![Deploy](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/deploy.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/deploy.yml)

<!-- Code Coverage -->
[![Backend Coverage](https://raw.githubusercontent.com/TGM-HIT/syt5-gek1051-mobile-application-listme/badges/.github/badges/backend-coverage.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/backend-ci.yml)
[![Frontend Coverage](https://raw.githubusercontent.com/TGM-HIT/syt5-gek1051-mobile-application-listme/badges/.github/badges/frontend-coverage.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/actions/workflows/frontend-ci.yml)

<!-- Backend stack -->
[![Java](https://img.shields.io/badge/Java-21-f89820?logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-6db33f?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-migration-cc0200?logo=flyway&logoColor=white)](https://flywaydb.org/)

<!-- Frontend stack -->
[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Pinia](https://img.shields.io/badge/Pinia-3-ffd859?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)

<!-- Infrastructure -->
[![Docker](https://img.shields.io/badge/Docker-compose-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node](https://img.shields.io/badge/Node-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-enabled-5a0fc8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![AWS](https://img.shields.io/badge/AWS-Lightsail-ff9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/lightsail/)

<!-- Repo meta -->
[![GitHub](https://img.shields.io/badge/GitHub-TGM--HIT-8b949e?logo=github)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme)
[![License](https://img.shields.io/badge/license-MIT-8b949e)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-3fb950)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-listme/pulls)
[![Made with love](https://img.shields.io/badge/made%20with-%E2%9D%A4-e05d44)](https://github.com/TGM-HIT)

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

**Backend:** Spring Boot 4.0.2 · Java 21 · PostgreSQL 16 · WebSocket/STOMP · Flyway
**Frontend:** Vue 3 · TypeScript · Vite · Pinia · Dexie (IndexedDB) · Tailwind CSS 4 · PWA
**Infra:** Docker · AWS Lightsail · GitHub Actions
