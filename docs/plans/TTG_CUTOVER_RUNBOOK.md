# TTG Cutover Runbook

Date: 2026-02-18

## Objective

Cut over from legacy TCG runtime to VTT-first LunchTable TTG stack in a single external release.

## Pre-cutover checks

1. `bun install`
2. `bun run test:once`
3. `cd apps/web && bun run type-check`
4. Validate `/api/vtt/*` auth and core routes.
5. Confirm legacy routes redirect:
   - `/play/:matchId` -> `/table/new`
   - `/story*` -> `/worlds`
   - `/collection|/decks*` -> `/studio?tab=builder`

## Data operations

1. Snapshot database backup.
2. Remove legacy TCG tables/data.
3. Verify new schema tables exist and are writable.

## Release sequence

1. Deploy Convex functions/schema.
2. Deploy web frontend.
3. Publish plugin package `@lunchtable-ttg/plugin-ttg`.
4. Monitor API error rate, session creation success, generation job throughput.

## Rollback

- Roll back deployment artifacts to previous known-good release.
- Restore DB snapshot if required.
