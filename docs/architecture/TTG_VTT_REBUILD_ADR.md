# ADR: LunchTable TTG VTT Rebuild

Date: 2026-02-18
Status: Accepted

## Context

The previous architecture centered on TCG-specific engine/components. Product direction requires a Roll20-class, AI-native tabletop platform with creator workflows, live sessions, and agent runtime support.

## Decision

1. Remove all TCG runtime domain packages and API surfaces.
2. Rebuild on current operational stack: Bun, React, Convex, Privy, milaidy embedding, Eliza integration.
3. Introduce VTT-first Convex domain modules:
   - worlds, sessions, maps/tokens/fog, generation, discovery/LFG, publishing, moderation, BYOK.
4. Replace agent HTTP surface with `/api/vtt/*` endpoints.
5. Keep product name “LunchTable TTG” while migrating technical namespace to `@lunchtable-ttg/*`.

## Consequences

- Immediate API break for legacy `/api/agent/game/*` clients.
- Hard deletion of TCG-specific data model and package code.
- Simpler long-term architecture aligned to VTT + creator ecosystem goals.
