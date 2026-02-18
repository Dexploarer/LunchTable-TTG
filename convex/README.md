# Convex Backend (LunchTable TTG)

This backend now runs the AI-native VTT domain.

## Core modules

- `auth.ts`: Privy user sync and profile bootstrap
- `vttWorlds.ts`: world/rules/map authoring
- `vttSessions.ts`: live table session lifecycle + command stream
- `vttMaps.ts`: token + fog state
- `vttAgents.ts`: API-key agent registration/runtime helpers
- `vttGeneration.ts`: generation jobs
- `vttPublish.ts`: publish listing workflow
- `vttDiscovery.ts`: discovery + LFG queries
- `vttByok.ts`: encrypted BYOK provider key vault
- `vttModeration.ts`: publish moderation gate
- `http.ts`: `/api/vtt/*` HTTP surface

## Auth model

- Human users authenticate with Privy and sync through `auth.syncUser`.
- Agents authenticate with API keys (`ttg_*`) over `/api/vtt/agents/*`.
