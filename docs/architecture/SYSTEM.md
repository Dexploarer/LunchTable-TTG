# LunchTable TTG VTT System Architecture

## Overview

LunchTable TTG is a VTT-first, AI-native tabletop platform designed for:
- Humans playing live sessions in the web client (desktop-first).
- Agents interacting via the `/api/vtt/*` HTTP API (plugin + direct clients).
- Creator workflows for building worlds, rulesets, maps, and prompt packs.

## System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     milaidy (Electron)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │                 <iframe> Web Client                │  │
│  │            (Vite + React 19 + Router 7)            │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │ Studio       │  │ Worlds/LFG  │  │ Live Table │ │  │
│  │  │ (creator)    │  │ (community) │  │ (VTT)      │ │  │
│  │  └──────┬───────┘  └──────┬─────┘  └──────┬─────┘ │  │
│  └─────────┼──────────────────┼───────────────┼──────┘  │
└────────────┼──────────────────┼───────────────┼─────────┘
             │          Convex realtime + auth   │
             ▼                                   ▼
┌──────────────────────────────────────────────────────────┐
│                       Convex Backend                     │
│                                                          │
│  Tables: users, worlds, maps, tokens, sessions, events,  │
│          dice rolls, fog states, generation jobs, BYOK   │
│                                                          │
│  Modules:                                                 │
│    - vttWorlds / vttMaps / vttSessions                    │
│    - vttGeneration (BYOK + synthetic)                     │
│    - vttPublish / vttDiscovery / vttModeration            │
│    - vttByok (encrypted provider key vault)               │
│    - http.ts exposes /api/vtt/* for agents                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│        Agent Runtime      │
│  ┌────────────────────┐  │
│  │ packages/plugin-ttg│  │
│  │  - join session    │  │──── HTTP ────► /api/vtt/*
│  │  - post commands   │  │
│  │  - generation jobs │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

## Data Flow: Live Session Lifecycle

```
1. Create world
   └─► vttWorlds.createWorld()

2. Create session
   └─► vttSessions.createSession(worldId)
       └─► inserts sessions + sessionParticipants (host role=gm)

3. Join session
   └─► vttSessions.joinSession(sessionId, role)

4. Live play: command/event stream
   └─► vttSessions.postCommand(sessionId, command, payload)
       └─► inserts sessionEvents rows (append-only)

5. Map state
   ├─► vttMaps.upsertToken(mapId, token transforms)
   └─► vttMaps.updateFog(mapId, fog settings)

6. Dice
   └─► vttSessions.rollDice(sessionId, expression, total, result)

7. Narrator / generation
   ├─► vttSessions.invokeNarrator(...) queues generationJobs(kind="narration")
   └─► vttGeneration.runGenerationJob() completes and auto-posts CHAT_MESSAGE

8. End session
   └─► vttSessions.closeSession(sessionId)
```

## Backend Modules (Source of Truth)

- `/Users/home/untitled folder 2/LunchTable-TTG/convex/schema.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttWorlds.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttSessions.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttMaps.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttAgents.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttGeneration.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttByok.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttPublish.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttDiscovery.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/vttModeration.ts`
- `/Users/home/untitled folder 2/LunchTable-TTG/convex/http.ts`

## Frontend Architecture

```
apps/web/src/
├── App.tsx                # routes + legacy redirects
├── pages/
│   ├── Studio.tsx         # creator workbench
│   ├── Worlds.tsx         # library + discovery
│   ├── WorldDetail.tsx    # world detail + session start
│   ├── Table.tsx          # live session client (Pixi stage + panels)
│   ├── Lfg.tsx            # looking-for-group
│   ├── Publish.tsx        # publish listing
│   └── ProviderSettings.tsx # BYOK keys
├── features/
│   ├── vttCanvas/*        # PixiJS stage + layers
│   ├── vttSession/*       # chat/dice/journal/initiative panels
│   └── ttgStudio/*        # studio tabs + local editing
└── lib/
    ├── ai/*               # provider adapters + registry
    ├── iframe.ts          # milaidy message protocol
    └── convexHelpers.ts   # typed Convex helpers
```

## Embedding Strategy (milaidy)

- The web client can run in-browser or as an iframe inside milaidy.
- The embed protocol lives in `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/lib/iframe.ts`.
- `TTG_AUTH` messages may include:
  - Privy JWT (full Convex auth)
  - `ttg_...` agent API key (spectator mode / HTTP-only surfaces)

## Agent Integration

- Agents authenticate via an API key issued by `/api/vtt/agents/register`.
- Agents can create sessions, join sessions, post commands, and run generation jobs via `/api/vtt/*`.
- The agent-friendly client wrapper is in `/Users/home/untitled folder 2/LunchTable-TTG/packages/plugin-ttg`.

