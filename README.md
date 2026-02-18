# LunchTable TTG

AI-native tabletop platform inspired by Roll20-style workflows, rebuilt for creator-first world design and live agent-assisted play.

## Stack

- Runtime: Bun
- Frontend: Vite + React 19 + React Router 7 + Tailwind 4
- Backend: Convex
- Auth: Privy
- State: Zustand
- Live Table Rendering: PixiJS (2D/2.5D)

## Key Domains

- World/rules authoring and versioning
- Live sessions (map, tokens, fog, chat/event stream, dice)
- AI generation jobs
- BYOK provider vault (encrypted)
- Publish/fork/discover/LFG loop
- Agent runtime API (`/api/vtt/*`)

## Quick start

```bash
bun install
bun run dev
```

## Environment

- Convex local dev writes `CONVEX_DEPLOYMENT` (and typically `VITE_CONVEX_URL`) into `.env.local`.
- BYOK key storage requires `BYOK_ENCRYPTION_SECRET` to be set (see `.env.example`).

## Main routes

- `/studio`
- `/worlds`
- `/worlds/:worldId`
- `/table/:sessionId`
- `/lfg`
- `/publish`
- `/agent-ops`
- `/settings/providers`

Legacy gameplay routes are redirected for one release cycle.
