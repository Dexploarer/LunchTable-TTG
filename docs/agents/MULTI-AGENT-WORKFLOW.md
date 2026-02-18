# Multi-Agent Development Workflow

This repo is built by multiple coding agents working in parallel on independent sections.

## Agent Ownership Model

Each agent owns a domain and its associated files. Avoid modifying files outside your domain without coordination,
especially shared API contracts.

### Domain Map

| Domain | Owner Agent | Files | Dependencies |
|--------|-------------|-------|--------------|
| Live Table UI | vtt-ui | `apps/web/src/pages/Table.tsx`, `apps/web/src/features/vtt*` | Convex sessions/maps/events |
| Creator Studio UI | studio-ui | `apps/web/src/pages/Studio.tsx`, `apps/web/src/features/ttgStudio/*`, `apps/web/src/lib/ttrpgStudio/*` | local studio models + Convex generation |
| Worlds/Publish/LFG UI | community-ui | `apps/web/src/pages/Worlds.tsx`, `apps/web/src/pages/WorldDetail.tsx`, `apps/web/src/pages/Publish.tsx`, `apps/web/src/pages/Lfg.tsx` | Convex publish/discovery |
| Auth & Embedding | auth-embed | `apps/web/src/components/auth/*`, `apps/web/src/hooks/auth/*`, `apps/web/src/lib/iframe.ts` | Privy, milaidy postMessage |
| Agent Plugin | plugin-dev | `packages/plugin-ttg/src/*` | `/api/vtt/*` HTTP API |
| Convex Backend | backend-dev | `convex/*` | schema + vtt modules + http router |

## Coordination Rules

### Shared Files (coordinate changes)
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/schema.ts` - tables + indexes
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/http.ts` - `/api/vtt/*` surface
- `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/lib/iframe.ts` - milaidy embed protocol
- `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/App.tsx` - routing contract
- `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/globals.css` - shared styles
- `/Users/home/untitled folder 2/LunchTable-TTG/packages/plugin-ttg/src/*` - agent action contract
- `/Users/home/untitled folder 2/LunchTable-TTG/package.json` - dependencies and scripts

### Safe to Own (no coordination needed)
- Domain-specific components under `apps/web/src/features/*`
- Domain-specific hooks and stores
- Domain-specific pages (when they don't alter global route contracts)

## How to Add a New Feature

1. **Check domain ownership** - is this your domain?
2. **Read the reference** - check existing `apps/web/src/features/*` patterns first
3. **Use skills** - use repo skills for Convex + frontend patterns
4. **Stay in your lane** - don't modify shared files without flagging
5. **Keep the contracts stable** - if you change a function signature, update call sites + tests
6. **Keep diffs small** - no drive-by refactors

## Adding Convex Functions

If you need a new Convex query/mutation:

1. Check if it already exists in the relevant module (`convex/vttSessions.ts`, `convex/vttMaps.ts`, etc).
2. If not, add it to the appropriate `convex/vtt*.ts` module (avoid "god files").
3. Validate args with `v.*` and enforce auth via `requireUser(ctx)` (or agent auth flows in `convex/vttAgents.ts`).
4. If the change affects `/api/vtt/*`, update `convex/http.ts` and `packages/plugin-ttg`.
5. Add/extend deterministic tests in `convex/*.test.ts`.

## Testing Boundaries

| Layer | Test Location | Framework |
|-------|---------------|-----------|
| Convex | `convex/*.test.ts` | Vitest |
| Web (unit) | `apps/web/src/**/*.test.ts(x)` | Vitest |
| E2E (optional) | `e2e/` | Playwright |

## Communication Protocol

When an agent needs something from another domain:

1. **Don't modify their files** - leave a note or open a ticket
2. **Use stable contracts**:
   - Convex function interfaces under `convex/vtt*.ts`
   - HTTP interface under `/api/vtt/*`
3. **Prefer event-driven surfaces**:
   - session event log (`sessionEvents`) with `eventType` + JSON payload
4. **Keep client/server semantics aligned** (event names, error strings, redirects)

## Quick Start for New Agent

```bash
# 1. Read the CLAUDE.md
cat CLAUDE.md

# 3. Load relevant skills
# /convex-best-practices - Convex patterns
# /frontend-patterns     - React patterns

# 4. Build in apps/web/ following existing conventions
```
