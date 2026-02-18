# Story Mode Refactor: Components, Cutscenes, Animations & Agent Parity

**Date**: 2026-02-15
**Status**: Approved

## Goal

Extract monolithic story pages into reusable components. Add video cutscenes, animated dialogue, comic-panel level progression, and victory animations. Maintain full parity with the HTTP agent API so milaidy Electron agents and CLI tools can play through story mode with structured JSON narrative payloads.

## Current State

- `Story.tsx` (119 lines) — flat chapter list, no animations
- `StoryChapter.tsx` (178 lines) — flat stage list with "Fight" button, no dialogue rendering
- `Play.tsx` (328 lines) — game board with basic victory/defeat text
- `components/story/` — empty directory
- Schema has `preMatchDialogue`, `postMatchWinDialogue`, `postMatchLoseDialogue` fields but they are **never rendered**
- Agent HTTP API exists for starting matches but returns no narrative content
- Framer Motion 12 is installed but unused
- 6 milunchlady avatar variants available in `/lunchtable/`

## Design

### Component Architecture

```
components/story/
├── StoryProvider.tsx       # Context: cutscene queue, dialogue state, progression
├── StoryIntro.tsx          # Full-screen video cutscene player
├── DialogueBox.tsx         # Animated typewriter dialogue + avatar
├── ChapterMap.tsx          # Comic panel grid of chapters
├── StagePanel.tsx          # Individual stage card (difficulty, stars, opponent)
├── BattleTransition.tsx    # Animated screen transition → game board
└── VictoryScreen.tsx       # Post-match results, stars, rewards, XP bar
```

### 1. StoryProvider (Context)

Manages the narrative layer that sits above page routing.

```typescript
type CutsceneEvent =
  | { type: "video"; src: string; skippable: boolean }
  | { type: "dialogue"; lines: DialogueLine[]; avatar?: string }
  | { type: "transition"; variant: "battle-start" | "victory" | "defeat" };

type StoryContextValue = {
  // Cutscene queue
  queue: CutsceneEvent[];
  currentEvent: CutsceneEvent | null;
  pushEvents: (events: CutsceneEvent[]) => void;
  advanceEvent: () => void;
  skipAll: () => void;

  // Progression state
  chapters: Chapter[];
  progress: StoryProgress[];
  stageProgress: StageProgress[];

  // Helpers
  isChapterComplete: (chapterId: string) => boolean;
  getStageStars: (stageId: string) => number;
  totalStars: number;
};
```

Wraps the `/story` route tree. Convex queries for chapters/progress live here instead of in individual pages.

### 2. StoryIntro (Video Cutscene)

Full-screen overlay that plays mp4 cutscenes at key moments:
- First time entering story mode
- Before boss stages
- Chapter completion milestones

```
Layout:
┌──────────────────────────────────────┐
│                                      │
│           <video> element            │
│         (object-fit: cover)          │
│                                      │
│                          [SKIP →]    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← progress bar
└──────────────────────────────────────┘
```

- Videos load from `/lunchtable/cutscenes/{id}.mp4`
- Graceful fallback: if video missing, skip to next event in queue
- Skip button appears after 2 seconds
- Zine border frame overlay (ink-frame.png)
- `onComplete` callback advances the cutscene queue

### 3. DialogueBox (Animated Dialogue)

Typewriter-style text boxes with character portraits.

```
Layout:
┌──────────────────────────────────────┐
│                                      │
│  (scene/background behind dialogue)  │
│                                      │
│  ┌──────┐ ┌────────────────────────┐ │
│  │avatar│ │ MILUNCHLADY            │ │
│  │ img  │ │ Welcome to the table,  │ │
│  │      │ │ kid. Hope you brought  │ │
│  │      │ │ your appetite...█      │ │
│  └──────┘ └────────────────────────┘ │
│                         [TAP TO SKIP]│
└──────────────────────────────────────┘
```

Features:
- **Typewriter effect**: Text reveals character by character (~30ms/char)
- **Avatar**: milunchlady variant or opponent art, with subtle idle animation (breathing/bob)
- **Speaker name**: Permanent Marker font, uppercase, yellow for milunchlady
- **Text box**: Paper-panel background with torn edge, Special Elite font
- **Tap to advance**: Click/tap anywhere advances to next line or completes current typewriter
- **Auto-advance**: Optional timer for agent streaming mode
- **Sound hooks**: `onCharReveal`, `onLineComplete` callbacks for future SFX

Data source: `preMatchDialogue` / `postMatchWinDialogue` / `postMatchLoseDialogue` from stage schema.

Avatar mapping:
```typescript
const SPEAKER_AVATARS: Record<string, string> = {
  milunchlady: "/lunchtable/milunchlady-classic.png",
  "milunchlady-goth": "/lunchtable/milunchlady-goth.png",
  "milunchlady-cyber": "/lunchtable/milunchlady-cyber.png",
  // ... etc
  default: "/lunchtable/milunchladypfp.png",
};
```

### 4. ChapterMap (Comic Panel Grid)

Replaces the flat chapter list with a comic book grid.

```
Layout:
┌─────────────────────────────────────────┐
│  STORY MODE     ★ 7/15                  │
│  Fight your way through the halls       │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Ch.1     │  │ Ch.2                 │ │
│  │ WELCOME  │  │ THE CAFETERIA        │ │
│  │ TO THE   │  │ WARS                 │ │
│  │ TABLE    │  │                      │ │
│  │ ★★★      │  │ 🔒 LOCKED           │ │
│  └──────────┘  └──────────────────────┘ │
│  ┌──────────────────────┐  ┌──────────┐ │
│  │ Ch.3                 │  │ Ch.4     │ │
│  │ HALL MONITOR         │  │ ???      │ │
│  │ REBELLION            │  │          │ │
│  │                      │  │ 🔒       │ │
│  └──────────────────────┘  └──────────┘ │
└─────────────────────────────────────────┘
```

Features:
- **Asymmetric grid**: Panels vary in size (1x1, 2x1, 1x2) like a comic page
- **Locked state**: Grayscale, torn paper overlay, padlock icon
- **Complete state**: Full color, star count, ink stamp "CLEARED"
- **Available state**: Slight glow/pulse, "NEW" badge
- **Framer Motion**: `staggerChildren` reveal on mount, `whileHover` scale
- **Panel border**: Thick ink border (2px black), slight rotation (±1deg) for hand-drawn feel
- **Background**: Each panel can have a chapter-specific image or archetype color

### 5. StagePanel (Stage Card)

Individual stage within a chapter, replacing the current flat list items.

```
┌────────────────────────────────────┐
│ STAGE 1                    ★★☆    │
│ ┌──────┐                          │
│ │ opp  │  FIRST STEPS             │
│ │ art  │  vs. Training Dummy      │
│ │      │  ┌──────┐                │
│ └──────┘  │ EASY │                │
│           └──────┘                │
│                        [ FIGHT ]  │
└────────────────────────────────────┘
```

Features:
- Difficulty badge with color (green/gold/red/purple)
- Star rating (0-3 stars based on performance)
- Opponent name and optional portrait
- "FIGHT" / "REPLAY" button (tcg-button style)
- Locked stages: grayed out with lock icon
- Completion checkmark with ink stamp effect

### 6. BattleTransition (Screen Transition)

Animated full-screen transition between stage select and game board.

Variants:
- **battle-start**: Black ink splash expands from center, wipes to game board
- **victory**: Gold confetti burst + stamp animation
- **defeat**: Screen cracks/tears like ripped paper

Implementation: Framer Motion `AnimatePresence` with portal overlay.
Duration: ~800ms. Skippable by tap.

### 7. VictoryScreen (Post-Match Results)

Replaces the current plain text victory/defeat.

```
┌──────────────────────────────────────┐
│                                      │
│         ★  VICTORY  ★               │
│    "You proved your worth"           │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ REWARDS                        │  │
│  │  💰 +30 gold    ⭐ +15 xp     │  │
│  │  🎴 First Clear Bonus: +50g   │  │
│  └────────────────────────────────┘  │
│                                      │
│  STARS EARNED: ★★☆                   │
│                                      │
│  [NEXT STAGE →]   [BACK TO MAP]      │
└──────────────────────────────────────┘
```

Features:
- Stars animate in one by one (Framer Motion spring)
- Reward counters tick up (gold, xp)
- First clear bonus highlighted
- "NEXT STAGE" button if more stages available
- Post-match dialogue triggers before rewards display
- Defeat variant: red tint, "TRY AGAIN" button

## Page Refactoring

### Story.tsx → Thin shell
```tsx
function Story() {
  return (
    <StoryProvider>
      <ChapterMap />
      <TrayNav />
    </StoryProvider>
  );
}
```

### StoryChapter.tsx → Thin shell
```tsx
function StoryChapter() {
  const { chapterId } = useParams();
  return (
    <StoryProvider>
      <StageList chapterId={chapterId} />
      <TrayNav />
    </StoryProvider>
  );
}
```

### Play.tsx → Enhanced with story layer
```tsx
function Play() {
  return (
    <StoryProvider>
      <BattleTransition />
      <DialogueBox />  {/* Pre-match dialogue overlay */}
      <GameBoard />    {/* Existing board logic extracted */}
      <VictoryScreen /> {/* Post-match overlay */}
    </StoryProvider>
  );
}
```

## Agent HTTP API Enhancements

### New Endpoints

```
GET /api/agent/story/progress
→ {
    chapters: Chapter[],
    chapterProgress: { chapterId, status, starsEarned, timesCompleted }[],
    stageProgress: { stageId, chapterId, stageNumber, status, starsEarned }[],
    totalStars: number,
    currentChapter: string | null
  }

GET /api/agent/story/stage/:stageId
→ {
    stage: Stage,
    narrative: {
      preMatchDialogue: { speaker, text, avatar? }[],
      cutsceneUrl?: string
    }
  }
```

### Enhanced Existing Endpoints

```
POST /api/agent/game/start
→ existing response + {
    narrative: {
      preMatchDialogue: { speaker, text, avatar? }[],
      cutsceneUrl?: string
    }
  }

// New: POST /api/agent/story/complete-stage
→ {
    rewards: { gold, xp, firstClearBonus? },
    starsEarned: number,
    narrative: {
      postMatchDialogue: { speaker, text, avatar? }[]
    },
    nextStage?: { stageId, stageNumber, name }
  }
```

### postMessage Protocol Extensions

```typescript
// Game → milaidy
{ type: "STORY_CUTSCENE", cutsceneId: string, src: string }
{ type: "STORY_DIALOGUE", speaker: string, text: string, avatar?: string }
{ type: "STAGE_COMPLETE", stageId: string, stars: number, rewards: object }

// milaidy → Game
{ type: "SKIP_CUTSCENE" }
```

## Animation Patterns

All animations use Framer Motion 12. Key patterns:

```typescript
// Stagger children reveal (chapter panels)
<motion.div variants={container} initial="hidden" animate="visible">
  {chapters.map(ch => (
    <motion.div key={ch._id} variants={item} />
  ))}
</motion.div>

// Typewriter text
const [displayed, setDisplayed] = useState("");
useEffect(() => {
  const interval = setInterval(() => {
    setDisplayed(prev => text.slice(0, prev.length + 1));
  }, 30);
  return () => clearInterval(interval);
}, [text]);

// Page transition
<AnimatePresence mode="wait">
  <motion.div key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  />
</AnimatePresence>
```

## File Manifest

### New files
```
apps/web/src/components/story/StoryProvider.tsx
apps/web/src/components/story/StoryIntro.tsx
apps/web/src/components/story/DialogueBox.tsx
apps/web/src/components/story/ChapterMap.tsx
apps/web/src/components/story/StagePanel.tsx
apps/web/src/components/story/BattleTransition.tsx
apps/web/src/components/story/VictoryScreen.tsx
apps/web/src/components/story/index.ts           # barrel export
```

### Modified files
```
apps/web/src/pages/Story.tsx          # Thin shell using ChapterMap
apps/web/src/pages/StoryChapter.tsx   # Thin shell using StagePanel list
apps/web/src/pages/Play.tsx           # Add story overlay layer
apps/web/src/globals.css              # Cutscene + dialogue CSS
apps/web/src/lib/iframe.ts            # New postMessage types
convex/http.ts                        # New agent story endpoints
convex/game.ts                        # Enhanced queries with narrative data
```

## Non-Goals (YAGNI)

- Branching story paths (linear progression only for now)
- Voice acting / audio (future enhancement)
- Multiplayer story co-op
- Custom cutscene editor
- Procedural dialogue generation
