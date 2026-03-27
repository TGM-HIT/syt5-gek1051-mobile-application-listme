# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Testing

### Unit Testing with Vitest
- `npm test`: Starts the test runner in watch mode.
- `npm run test:run`: Runs tests once.

### E2E Testing with Cypress
- `npm run cypress:open`: Opens the Cypress Test Runner (GUI).
- `npm run cypress:run`: Runs Cypress tests in headless mode.

#### Test Coverage
Die Cypress-Tests sind nun modular nach Features (IDs aus STORIES.md) aufgeteilt:
- **Offline & Sync:** `id1-offline.cy.ts`, `id5-conflict-management.cy.ts`, `id7-realtime-sync.cy.ts`, `id24-ble-sync.cy.ts`
- **Listenverwaltung:** `id3-lists-crud.cy.ts`, `id13-list-duplication.cy.ts`, `id23-trash.cy.ts`
- **Artikelinteraktion:** `id2-check-uncheck.cy.ts`, `id4-items-categories-search.cy.ts`, `id8-items-edit-delete.cy.ts`, `id9-items-metadata.cy.ts`
- **Erweiterte Artikel-Features:** `id10-item-images.cy.ts`, `id11-favorites.cy.ts`, `id14-budget-costs.cy.ts`, `id18-barcode-scan.cy.ts`, `id19-voice-input.cy.ts`, `id21-suggestions.cy.ts`
- **Teilen & Kollaboration:** `id6-sharing-invitation.cy.ts`, `id12-sharing-participants.cy.ts`, `id20-sharing-qr.cy.ts`
- **System & Design:** `id15-dark-mode.cy.ts`, `id16-export.cy.ts`, `id17-authentication.cy.ts`, `id22-smartwatch.cy.ts`

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
