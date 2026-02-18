# LunchTable TTG Repository Guide

## Purpose

LunchTable TTG is now a VTT-first platform (not a trading card game runtime).

## Current architecture

- `apps/web`: creator studio + live VTT frontend
- `convex`: VTT backend modules and `/api/vtt/*` HTTP API
- `packages/plugin-ttg`: agent plugin client for VTT APIs

## Backend modules

- `convex/vttWorlds.ts`
- `convex/vttSessions.ts`
- `convex/vttMaps.ts`
- `convex/vttAgents.ts`
- `convex/vttGeneration.ts`
- `convex/vttPublish.ts`
- `convex/vttDiscovery.ts`
- `convex/vttByok.ts`
- `convex/vttModeration.ts`
- `convex/http.ts`

## Route contract

Primary external API surface is `/api/vtt/*`.

## Tooling

Use Bun for install/dev/test/build.
