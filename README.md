# Lanka Offers Admin Dashboard

Private operations console for the Lanka Offers admin API: scrape runs and scheduling, offer review and publishing, duplicates, validation, parser rules, geo coverage, cost tracking and system logs. React 19, TypeScript, Vite, AWS Cloudscape. No login by design: run it on a trusted local/private network only.

## Structure

```
src/
  App.tsx            Route table (pages are lazy-loaded except Overview)
  layouts/           AppLayout: top bar, side navigation, help panel
  pages/             One file per screen
  components/        Shared pieces (map, audit timeline, evidence viewer, stepper, confidence bar)
  services/          api.ts (typed client for /api/*), use-api.ts (loading/error hook)
  hooks/ types/
```

The side navigation is grouped by workflow: Review & publishing, Ingestion, Quality & rules, Reference data, System. Detail routes (`/runs/:id`, `/offers/:id/review`) keep their parent entry highlighted.

## Setup

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173, proxies /api to VITE_API_URL
```

`VITE_API_URL` defaults to `http://localhost:3002`. The dashboard needs the admin API (`npm run api` in the admin API repository) for any data. The admin API no longer applies the schema when it boots (`AUTO_MIGRATE=false` by default) but it does write to the database in its `.env` (scrape runs, staging, publishing), so run it against a disposable local database rather than production Neon.

## Commands

`npm run dev`, `npm run build` (type-check + bundle), `npm run lint` (oxlint), `npm run preview`, `npm test` (Vitest).

## Operational safety in the UI

- **Run scraper** separates a *Dry run* (no offer/run/staging writes) from an *Authorized scrape* (needs an explicit acknowledgement) and geocoding (can use paid quota). Active jobs show whether they write, and can be cancelled after confirmation.
- **Offer review**: approve, reject, send back, disable and publish each confirm first and state their consequence. Publishing also needs an acknowledgement. Approval is not publication.
- **Scheduler**: turning automation on needs acknowledgement; pausing does not. "Run now" confirms. There is no "add schedule" because the admin API cannot create one.
- **Bank status** shows last run, last attempt, last success, extraction, rule results, review backlog and published count as separate columns.

## Tests

`npm test` runs Vitest with jsdom and Testing Library (`tests/`). Every `/api` request is answered from fixtures (`tests/helpers.tsx`); any request that is not same-origin `/api/*` is blocked, so tests cannot reach an admin API or database. They cover navigation, API-unavailable and partial-failure states, the bank health table, scraper and scheduler confirmations, review approval/rejection/publish confirmations, conflict handling and request isolation.

## Behaviour notes

- All data comes from the admin API; there is no mock data. When the API is unreachable, the Overview shows an error and "—" / "Unavailable" rather than zeros or green health indicators.
- `oxlint` currently reports warnings (state updates inside effects, a non-component export in `BankParserRulesPage.tsx`); they are not errors and are not yet fixed.
- The suite checks UI behaviour against fixtures. It has not been run against a live admin API.
