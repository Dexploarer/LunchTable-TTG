# Story Mode Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract monolithic story pages into 7 reusable components with video cutscenes, animated dialogue, comic-panel level progression, and agent API parity.

**Architecture:** StoryProvider context manages cutscene queue + progression state. Pages become thin shells. All narrative data flows through the provider — browser renders with Framer Motion animations, agents receive structured JSON via HTTP API. Dialogue uses milunchlady avatar variants from `/lunchtable/`.

**Tech Stack:** React 19.2, Framer Motion 12, Convex (queries/mutations/HTTP actions), TypeScript, Tailwind 4

---

### Task 1: StoryProvider — Context + Data Layer

The foundation. All other components consume this context.

**Files:**
- Create: `apps/web/src/components/story/StoryProvider.tsx`

**Step 1: Create the provider**

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { apiAny, useConvexQuery } from "@/lib/convexHelpers";

// ── Types ────────────────────────────────────────────────────────

export type DialogueLine = {
  speaker: string;
  text: string;
  avatar?: string;
};

export type CutsceneEvent =
  | { type: "video"; src: string; skippable: boolean }
  | { type: "dialogue"; lines: DialogueLine[]; avatar?: string }
  | { type: "transition"; variant: "battle-start" | "victory" | "defeat" };

export type Chapter = {
  _id: string;
  title: string;
  description?: string;
  chapterNumber?: number;
  actNumber?: number;
  imageUrl?: string;
  archetype?: string;
  status?: string;
};

export type Stage = {
  _id: string;
  stageNumber: number;
  name?: string;
  title?: string;
  description: string;
  opponentName?: string;
  difficulty?: string;
  preMatchDialogue?: DialogueLine[];
  postMatchWinDialogue?: DialogueLine[];
  postMatchLoseDialogue?: DialogueLine[];
  rewardGold?: number;
  rewardXp?: number;
  firstClearBonus?: number | { gold?: number; xp?: number; gems?: number };
};

type StoryProgress = { chapterId: string; completed: boolean };
type StageProgressEntry = {
  stageId: string;
  chapterId: string;
  stageNumber: number;
  status: string;
  starsEarned: number;
  timesCompleted: number;
  firstClearClaimed: boolean;
};

type StoryContextValue = {
  // Data
  chapters: Chapter[] | undefined;
  progress: StoryProgress[] | undefined;
  stageProgress: StageProgressEntry[] | undefined;
  isLoading: boolean;

  // Progression helpers
  isChapterComplete: (chapterId: string) => boolean;
  isStageComplete: (stageId: string) => boolean;
  getStageStars: (stageId: string) => number;
  totalStars: number;

  // Cutscene queue
  queue: CutsceneEvent[];
  currentEvent: CutsceneEvent | null;
  pushEvents: (events: CutsceneEvent[]) => void;
  advanceEvent: () => void;
  skipAll: () => void;
  isPlaying: boolean;
};

// ── Context ──────────────────────────────────────────────────────

const StoryContext = createContext<StoryContextValue | null>(null);

export function useStory() {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error("useStory must be used within StoryProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────

export function StoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();

  const chapters = useConvexQuery(apiAny.game.getChapters, {}) as Chapter[] | undefined;
  const progress = useConvexQuery(
    apiAny.game.getStoryProgress,
    isAuthenticated ? {} : "skip",
  ) as StoryProgress[] | undefined;
  const stageProgress = useConvexQuery(
    apiAny.game.getStageProgress,
    isAuthenticated ? {} : "skip",
  ) as StageProgressEntry[] | undefined;

  // Cutscene queue
  const [queue, setQueue] = useState<CutsceneEvent[]>([]);
  const currentEvent = queue[0] ?? null;
  const isPlaying = queue.length > 0;

  const pushEvents = useCallback((events: CutsceneEvent[]) => {
    setQueue((prev) => [...prev, ...events]);
  }, []);

  const advanceEvent = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const skipAll = useCallback(() => {
    setQueue([]);
  }, []);

  // Progress helpers
  const completedChapters = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.chapterId),
  );
  const completedStages = new Set(
    (stageProgress ?? [])
      .filter((p) => p.status === "completed" || p.status === "starred")
      .map((p) => p.stageId),
  );

  const isChapterComplete = useCallback(
    (chapterId: string) => completedChapters.has(chapterId),
    [completedChapters],
  );
  const isStageComplete = useCallback(
    (stageId: string) => completedStages.has(stageId),
    [completedStages],
  );
  const getStageStars = useCallback(
    (stageId: string) =>
      (stageProgress ?? []).find((p) => p.stageId === stageId)?.starsEarned ?? 0,
    [stageProgress],
  );
  const totalStars = (stageProgress ?? []).reduce((sum, p) => sum + p.starsEarned, 0);

  const value: StoryContextValue = {
    chapters,
    progress,
    stageProgress,
    isLoading: chapters === undefined,
    isChapterComplete,
    isStageComplete,
    getStageStars,
    totalStars,
    queue,
    currentEvent,
    pushEvents,
    advanceEvent,
    skipAll,
    isPlaying,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}
```

**Step 2: Verify the build compiles**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`
Expected: No TypeScript errors (unused export warnings OK)

**Step 3: Commit**

```bash
git add apps/web/src/components/story/StoryProvider.tsx
git commit -m "feat(story): add StoryProvider context with cutscene queue and progression helpers"
```

---

### Task 2: DialogueBox — Typewriter Animated Dialogue

**Files:**
- Create: `apps/web/src/components/story/DialogueBox.tsx`

**Step 1: Create the component**

```tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStory, type DialogueLine } from "./StoryProvider";

const SPEAKER_AVATARS: Record<string, string> = {
  milunchlady: "/lunchtable/milunchlady-classic.png",
  "milunchlady-goth": "/lunchtable/milunchlady-goth.png",
  "milunchlady-cyber": "/lunchtable/milunchlady-cyber.png",
  "milunchlady-hypebeast": "/lunchtable/milunchlady-hypebeast.png",
  "milunchlady-prep": "/lunchtable/milunchlady-prep.png",
  "milunchlady-gamer": "/lunchtable/milunchlady-gamer.png",
};

const DEFAULT_AVATAR = "/lunchtable/milunchladypfp.png";
const CHAR_DELAY = 30; // ms per character

function getAvatar(speaker: string, lineAvatar?: string): string {
  if (lineAvatar) return lineAvatar;
  const key = speaker.toLowerCase().replace(/\s+/g, "-");
  return SPEAKER_AVATARS[key] ?? DEFAULT_AVATAR;
}

export function DialogueBox() {
  const { currentEvent, advanceEvent } = useStory();

  if (!currentEvent || currentEvent.type !== "dialogue") return null;

  return (
    <DialogueSequence
      lines={currentEvent.lines}
      defaultAvatar={currentEvent.avatar}
      onComplete={advanceEvent}
    />
  );
}

function DialogueSequence({
  lines,
  defaultAvatar,
  onComplete,
}: {
  lines: DialogueLine[];
  defaultAvatar?: string;
  onComplete: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const currentLine = lines[lineIndex];
  const fullText = currentLine?.text ?? "";

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;
    setDisplayedText("");
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= fullText.length) {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(fullText.slice(0, i));
      }
    }, CHAR_DELAY);

    return () => clearInterval(interval);
  }, [lineIndex, fullText, currentLine]);

  const handleTap = useCallback(() => {
    if (isTyping) {
      // Skip to full text
      setDisplayedText(fullText);
      setIsTyping(false);
    } else if (lineIndex < lines.length - 1) {
      // Next line
      setLineIndex((prev) => prev + 1);
    } else {
      // Done
      onComplete();
    }
  }, [isTyping, fullText, lineIndex, lines.length, onComplete]);

  if (!currentLine) return null;

  const avatar = getAvatar(currentLine.speaker, currentLine.avatar ?? defaultAvatar);
  const isMilunchlady = currentLine.speaker.toLowerCase().includes("milunchlady") ||
    currentLine.speaker.toLowerCase().includes("lunchlady");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleTap}
      style={{ cursor: "pointer" }}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialogue panel */}
      <motion.div
        className="relative w-full max-w-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div className="flex gap-4 items-end">
          {/* Avatar */}
          <motion.div
            className="shrink-0 w-20 h-20 md:w-24 md:h-24 border-2 border-[#121212] bg-white overflow-hidden shadow-zine"
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <img
              src={avatar}
              alt={currentLine.speaker}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>

          {/* Text box */}
          <div className="flex-1 paper-panel p-4 md:p-5">
            {/* Speaker name */}
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{
                fontFamily: "Permanent Marker, Outfit, sans-serif",
                color: isMilunchlady ? "#ffcc00" : "#121212",
              }}
            >
              {currentLine.speaker}
            </p>

            {/* Text with typewriter */}
            <p
              className="text-sm md:text-base leading-relaxed min-h-[3em]"
              style={{ fontFamily: "Special Elite, cursive" }}
            >
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-[#121212] ml-0.5 animate-pulse" />
              )}
            </p>

            {/* Advance hint */}
            <p className="text-[10px] text-[#999] uppercase tracking-wider text-right mt-2">
              {isTyping
                ? "tap to skip"
                : lineIndex < lines.length - 1
                  ? "tap to continue"
                  : "tap to close"}
            </p>
          </div>
        </div>

        {/* Line progress dots */}
        {lines.length > 1 && (
          <div className="flex gap-1 justify-center mt-3">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 border border-[#121212] transition-colors ${
                  i <= lineIndex ? "bg-[#121212]" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/components/story/DialogueBox.tsx
git commit -m "feat(story): add DialogueBox with typewriter animation and milunchlady avatars"
```

---

### Task 3: StoryIntro — Video Cutscene Player

**Files:**
- Create: `apps/web/src/components/story/StoryIntro.tsx`

**Step 1: Create the component**

```tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStory } from "./StoryProvider";

export function StoryIntro() {
  const { currentEvent, advanceEvent } = useStory();

  if (!currentEvent || currentEvent.type !== "video") return null;

  return (
    <VideoPlayer
      src={currentEvent.src}
      skippable={currentEvent.skippable}
      onComplete={advanceEvent}
    />
  );
}

function VideoPlayer({
  src,
  skippable,
  onComplete,
}: {
  src: string;
  skippable: boolean;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress(video.currentTime / video.duration);

    // Show skip after 2 seconds
    if (video.currentTime >= 2 && skippable) {
      setShowSkip(true);
    }
  }, [skippable]);

  const handleError = useCallback(() => {
    // Video failed to load — skip gracefully
    setHasError(true);
    onComplete();
  }, [onComplete]);

  if (hasError) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={handleError}
        className="w-full h-full object-cover"
      />

      {/* Ink frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/lunchtable/ink-frame.png"
          alt=""
          className="w-full h-full object-fill opacity-30"
          draggable={false}
        />
      </div>

      {/* Skip button */}
      <AnimatePresence>
        {showSkip && (
          <motion.button
            type="button"
            onClick={onComplete}
            className="absolute bottom-8 right-8 tcg-button px-6 py-3 text-sm z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            SKIP &rarr;
          </motion.button>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div
          className="h-full bg-[#ffcc00]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/components/story/StoryIntro.tsx
git commit -m "feat(story): add StoryIntro video cutscene player with skip and graceful fallback"
```

---

### Task 4: ChapterMap — Comic Panel Grid

**Files:**
- Create: `apps/web/src/components/story/ChapterMap.tsx`
- Modify: `apps/web/src/globals.css` (add comic panel CSS)

**Step 1: Create the component**

```tsx
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useStory } from "./StoryProvider";

// Comic grid sizes — panels alternate asymmetrically
const PANEL_LAYOUTS = [
  "col-span-2 row-span-2",  // Large feature panel
  "col-span-1 row-span-1",  // Small square
  "col-span-1 row-span-2",  // Tall panel
  "col-span-2 row-span-1",  // Wide panel
  "col-span-1 row-span-1",  // Small square
  "col-span-1 row-span-1",  // Small square
];

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const panelVariant = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 15, stiffness: 200 },
  },
};

export function ChapterMap() {
  const navigate = useNavigate();
  const { chapters, isLoading, isChapterComplete, totalStars } = useStory();

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      {/* Header */}
      <header className="border-b-2 border-[#121212] px-6 py-5">
        <div className="flex items-baseline justify-between">
          <div>
            <h1
              className="text-4xl tracking-tighter"
              style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
            >
              STORY MODE
            </h1>
            <p
              className="text-sm text-[#666] mt-1"
              style={{ fontFamily: "Special Elite, cursive" }}
            >
              Fight your way through the halls
            </p>
          </div>
          {totalStars > 0 && (
            <div className="text-right">
              <p
                className="text-2xl"
                style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, color: "#ffcc00" }}
              >
                &#9733; {totalStars}
              </p>
              <p className="text-[10px] text-[#999] uppercase tracking-wider">total stars</p>
            </div>
          )}
        </div>
      </header>

      {/* Comic grid */}
      <div className="p-6 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#121212] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !chapters || chapters.length === 0 ? (
          <div className="paper-panel p-12 text-center">
            <p className="text-[#666] font-bold uppercase text-sm">
              No chapters available yet.
            </p>
            <p
              className="text-xs text-[#999] mt-2"
              style={{ fontFamily: "Special Elite, cursive" }}
            >
              Check back soon — the school year has just begun.
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 gap-3 md:gap-4 auto-rows-[140px] md:auto-rows-[180px]"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {chapters.map((chapter, i) => {
              const completed = isChapterComplete(chapter._id);
              const layout = PANEL_LAYOUTS[i % PANEL_LAYOUTS.length];
              // Slight random rotation for hand-drawn feel
              const rotation = ((i * 7 + 3) % 5) - 2; // -2 to +2 degrees

              return (
                <motion.button
                  key={chapter._id}
                  type="button"
                  onClick={() => navigate(`/story/${chapter._id}`)}
                  className={`comic-panel ${layout} relative overflow-hidden text-left cursor-pointer group`}
                  style={{ rotate: `${rotation}deg` }}
                  variants={panelVariant}
                  whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Background image if available */}
                  {chapter.imageUrl && (
                    <img
                      src={chapter.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      draggable={false}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-between h-full p-4">
                    <div>
                      <span
                        className="text-[10px] text-[#999] uppercase tracking-wider block"
                        style={{ fontFamily: "Special Elite, cursive" }}
                      >
                        Chapter {chapter.chapterNumber ?? i + 1}
                      </span>
                      <h2
                        className="text-lg md:text-2xl leading-tight mt-0.5"
                        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
                      >
                        {chapter.title}
                      </h2>
                      {chapter.description && (
                        <p
                          className="text-xs text-[#666] mt-1 leading-snug line-clamp-2"
                          style={{ fontFamily: "Special Elite, cursive" }}
                        >
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center justify-between mt-2">
                      {completed ? (
                        <span className="comic-stamp text-[#38a169] border-[#38a169]">
                          CLEARED
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#ffcc00] font-bold uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add CSS for comic panels to globals.css**

Append to `apps/web/src/globals.css` after the existing `.shadow-zine-lg` block (after line 438):

```css
/* Comic Panel Grid */
.comic-panel {
  background-color: #ffffff;
  border: 3px solid #121212;
  box-shadow: 4px 4px 0px 0px rgba(18, 18, 18, 1);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  position: relative;
}

.comic-panel::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  mix-blend-mode: multiply;
}

.comic-panel:hover {
  box-shadow: 6px 6px 0px 0px rgba(18, 18, 18, 1);
}

.comic-stamp {
  display: inline-block;
  font-family: "Permanent Marker", "Outfit", sans-serif;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border: 2px solid currentColor;
  transform: rotate(-4deg);
}
```

**Step 3: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add apps/web/src/components/story/ChapterMap.tsx apps/web/src/globals.css
git commit -m "feat(story): add ChapterMap comic panel grid with stagger animation"
```

---

### Task 5: StagePanel — Individual Stage Card

**Files:**
- Create: `apps/web/src/components/story/StagePanel.tsx`

**Step 1: Create the component**

```tsx
import { motion } from "framer-motion";
import { useStory, type Stage } from "./StoryProvider";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#38a169",
  medium: "#d69e2e",
  hard: "#e53e3e",
  boss: "#805ad5",
};

export function StagePanel({
  stage,
  isStarting,
  onFight,
}: {
  stage: Stage;
  isStarting: boolean;
  onFight: () => void;
}) {
  const { isStageComplete, getStageStars } = useStory();
  const completed = isStageComplete(stage._id);
  const stars = getStageStars(stage._id);
  const diffColor = DIFFICULTY_COLORS[stage.difficulty ?? "easy"] ?? "#666";

  return (
    <motion.div
      className={`paper-panel p-5 md:p-6 transition-all ${completed ? "opacity-70" : ""}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: completed ? 0.7 : 1, x: 0 }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Stage metadata row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ fontFamily: "Special Elite, cursive", color: "#999" }}
            >
              Stage {stage.stageNumber}
            </span>
            {stage.difficulty && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border"
                style={{ borderColor: diffColor, color: diffColor }}
              >
                {stage.difficulty}
              </span>
            )}
            {completed && (
              <span className="text-[10px] font-bold text-[#38a169]">&#10003;</span>
            )}
          </div>

          {/* Title */}
          <h2
            className="text-xl leading-tight mb-1"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
          >
            {stage.title ?? stage.name ?? `Stage ${stage.stageNumber}`}
          </h2>

          {/* Description */}
          <p
            className="text-sm text-[#666] leading-snug"
            style={{ fontFamily: "Special Elite, cursive" }}
          >
            {stage.description}
          </p>

          {/* Opponent */}
          {stage.opponentName && (
            <p className="text-xs text-[#999] mt-2 uppercase tracking-wider">
              vs. {stage.opponentName}
            </p>
          )}

          {/* Stars */}
          {completed && (
            <div className="flex gap-0.5 mt-2">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="text-sm"
                  style={{ color: n <= stars ? "#ffcc00" : "#ddd" }}
                >
                  &#9733;
                </span>
              ))}
            </div>
          )}

          {/* Rewards preview */}
          {(stage.rewardGold || stage.rewardXp) && !completed && (
            <div className="flex gap-3 mt-2">
              {stage.rewardGold && (
                <span className="text-[10px] text-[#999] uppercase">
                  +{stage.rewardGold} gold
                </span>
              )}
              {stage.rewardXp && (
                <span className="text-[10px] text-[#999] uppercase">
                  +{stage.rewardXp} xp
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fight button */}
        <button
          type="button"
          onClick={onFight}
          disabled={isStarting}
          className="tcg-button-primary px-5 py-2.5 text-sm shrink-0 disabled:opacity-50"
        >
          {isStarting ? "..." : completed ? "Replay" : "Fight"}
        </button>
      </div>
    </motion.div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/components/story/StagePanel.tsx
git commit -m "feat(story): add StagePanel with stars, rewards preview, and difficulty badges"
```

---

### Task 6: BattleTransition — Screen Transition Animations

**Files:**
- Create: `apps/web/src/components/story/BattleTransition.tsx`

**Step 1: Create the component**

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { useStory } from "./StoryProvider";

export function BattleTransition() {
  const { currentEvent, advanceEvent } = useStory();

  if (!currentEvent || currentEvent.type !== "transition") return null;

  return (
    <AnimatePresence>
      <TransitionOverlay variant={currentEvent.variant} onComplete={advanceEvent} />
    </AnimatePresence>
  );
}

function TransitionOverlay({
  variant,
  onComplete,
}: {
  variant: "battle-start" | "victory" | "defeat";
  onComplete: () => void;
}) {
  if (variant === "battle-start") {
    return (
      <motion.div
        className="fixed inset-0 z-[70] bg-[#121212] flex items-center justify-center"
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: "circle(150% at 50% 50%)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        onAnimationComplete={onComplete}
        onClick={onComplete}
      >
        <motion.h1
          className="text-6xl md:text-8xl text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          FIGHT!
        </motion.h1>
      </motion.div>
    );
  }

  if (variant === "victory") {
    return (
      <motion.div
        className="fixed inset-0 z-[70] bg-[#fdfdfb] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={() => setTimeout(onComplete, 600)}
      >
        <motion.div className="text-center">
          <motion.div
            className="text-7xl md:text-9xl"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, color: "#ffcc00" }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 8, stiffness: 100 }}
          >
            &#9733;
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl mt-2"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            VICTORY
          </motion.h1>
        </motion.div>
      </motion.div>
    );
  }

  // defeat
  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-[#121212] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => setTimeout(onComplete, 600)}
    >
      <motion.h1
        className="text-5xl md:text-7xl text-[#e53e3e]"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 10 }}
      >
        DEFEAT
      </motion.h1>
    </motion.div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/components/story/BattleTransition.tsx
git commit -m "feat(story): add BattleTransition with ink-splash, victory star, and defeat animations"
```

---

### Task 7: VictoryScreen — Post-Match Results

**Files:**
- Create: `apps/web/src/components/story/VictoryScreen.tsx`

**Step 1: Create the component**

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

type VictoryProps = {
  won: boolean;
  rewards?: { gold?: number; xp?: number; firstClearBonus?: number };
  starsEarned?: number;
  onPlayDialogue?: () => void;
  nextStageAvailable?: boolean;
  storyPath?: string;
};

export function VictoryScreen({
  won,
  rewards,
  starsEarned = 0,
  onPlayDialogue,
  nextStageAvailable,
  storyPath = "/story",
}: VictoryProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-[#fdfdfb] p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="paper-panel p-8 md:p-12 text-center max-w-md w-full">
        {/* Title */}
        <motion.h1
          className="text-5xl md:text-6xl mb-2"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 900,
            color: won ? "#121212" : "#e53e3e",
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10 }}
        >
          {won ? "VICTORY" : "DEFEAT"}
        </motion.h1>

        <motion.p
          className="text-sm text-[#666] mb-6"
          style={{ fontFamily: "Special Elite, cursive" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {won
            ? "You proved your worth at the table."
            : "The hallway isn't done with you yet."}
        </motion.p>

        {/* Stars */}
        {won && starsEarned > 0 && (
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((n) => (
              <motion.span
                key={n}
                className="text-4xl"
                style={{ color: n <= starsEarned ? "#ffcc00" : "#ddd" }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5 + n * 0.2,
                  type: "spring",
                  damping: 8,
                  stiffness: 150,
                }}
              >
                &#9733;
              </motion.span>
            ))}
          </div>
        )}

        {/* Rewards */}
        {won && rewards && (rewards.gold || rewards.xp) && (
          <motion.div
            className="paper-panel-flat p-4 mb-6 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              REWARDS
            </p>
            <div className="flex gap-4 text-sm">
              {rewards.gold && (
                <AnimatedCounter label="gold" value={rewards.gold} delay={1.0} />
              )}
              {rewards.xp && (
                <AnimatedCounter label="xp" value={rewards.xp} delay={1.2} />
              )}
            </div>
            {rewards.firstClearBonus && (
              <motion.p
                className="text-xs mt-2 font-bold uppercase"
                style={{ color: "#ffcc00" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                First Clear Bonus: +{rewards.firstClearBonus} gold
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: won ? 1.6 : 0.6 }}
        >
          {won && nextStageAvailable && (
            <button
              type="button"
              onClick={onPlayDialogue}
              className="tcg-button-primary px-8 py-3 text-lg w-full"
            >
              NEXT STAGE &rarr;
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(storyPath)}
            className={`${won && nextStageAvailable ? "tcg-button" : "tcg-button-primary"} px-8 py-3 text-lg w-full`}
          >
            {won ? "BACK TO MAP" : "TRY AGAIN"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnimatedCounter({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let current = 0;
      const step = Math.max(1, Math.ceil(value / 20));
      const interval = setInterval(() => {
        current = Math.min(current + step, value);
        setDisplayed(current);
        if (current >= value) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}>
      +{displayed} <span className="text-[10px] text-[#999] uppercase">{label}</span>
    </span>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/components/story/VictoryScreen.tsx
git commit -m "feat(story): add VictoryScreen with animated stars, reward counters, and next-stage flow"
```

---

### Task 8: Barrel Export + Wire Pages to Components

**Files:**
- Create: `apps/web/src/components/story/index.ts`
- Modify: `apps/web/src/pages/Story.tsx` (replace with thin shell)
- Modify: `apps/web/src/pages/StoryChapter.tsx` (replace with thin shell)
- Modify: `apps/web/src/pages/Play.tsx` (add story overlay layer)

**Step 1: Create barrel export**

```ts
export { StoryProvider, useStory } from "./StoryProvider";
export type { DialogueLine, CutsceneEvent, Chapter, Stage } from "./StoryProvider";
export { DialogueBox } from "./DialogueBox";
export { StoryIntro } from "./StoryIntro";
export { ChapterMap } from "./ChapterMap";
export { StagePanel } from "./StagePanel";
export { BattleTransition } from "./BattleTransition";
export { VictoryScreen } from "./VictoryScreen";
```

**Step 2: Rewrite Story.tsx as thin shell**

Replace entire file `apps/web/src/pages/Story.tsx`:

```tsx
import { StoryProvider, ChapterMap, StoryIntro, DialogueBox } from "@/components/story";
import { TrayNav } from "@/components/layout/TrayNav";

export function Story() {
  return (
    <StoryProvider>
      <ChapterMap />
      <StoryIntro />
      <DialogueBox />
      <TrayNav />
    </StoryProvider>
  );
}
```

**Step 3: Rewrite StoryChapter.tsx as thin shell with StagePanel**

Replace entire file `apps/web/src/pages/StoryChapter.tsx`:

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { apiAny, useConvexQuery, useConvexMutation } from "@/lib/convexHelpers";
import {
  StoryProvider,
  StagePanel,
  DialogueBox,
  BattleTransition,
  useStory,
  type Stage,
} from "@/components/story";
import { TrayNav } from "@/components/layout/TrayNav";

export function StoryChapter() {
  return (
    <StoryProvider>
      <StoryChapterInner />
      <DialogueBox />
      <BattleTransition />
      <TrayNav />
    </StoryProvider>
  );
}

function StoryChapterInner() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { pushEvents } = useStory();

  const stages = useConvexQuery(
    apiAny.game.getChapterStages,
    chapterId ? { chapterId } : "skip",
  ) as Stage[] | undefined;

  const startBattle = useConvexMutation(apiAny.game.startStoryBattle);
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sorted = [...(stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber);

  const handleStartBattle = async (stage: Stage) => {
    if (!chapterId) return;
    setStarting(stage.stageNumber);
    setError("");

    try {
      // Play pre-match dialogue if available
      if (stage.preMatchDialogue && stage.preMatchDialogue.length > 0) {
        pushEvents([{ type: "dialogue", lines: stage.preMatchDialogue }]);
      }

      // Battle transition
      pushEvents([{ type: "transition", variant: "battle-start" }]);

      const result = await startBattle({ chapterId, stageNumber: stage.stageNumber });
      navigate(`/play/${result.matchId}`);
    } catch (err: any) {
      setError(err.message ?? "Failed to start battle.");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      {/* Header */}
      <header className="border-b-2 border-[#121212] px-6 py-5">
        <button
          type="button"
          onClick={() => navigate("/story")}
          className="text-xs font-bold uppercase tracking-wider text-[#666] hover:text-[#121212] transition-colors mb-2 block"
          style={{ fontFamily: "Special Elite, cursive" }}
        >
          &larr; Back to chapters
        </button>
        <h1
          className="text-4xl tracking-tighter"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
        >
          STAGES
        </h1>
      </header>

      {/* Stage list */}
      <div className="p-6 max-w-3xl mx-auto">
        {!stages ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#121212] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="paper-panel p-12 text-center">
            <p className="text-[#666] font-bold uppercase text-sm">
              No stages in this chapter yet.
            </p>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {sorted.map((stage) => (
              <StagePanel
                key={stage._id}
                stage={stage}
                isStarting={starting === stage.stageNumber}
                onFight={() => handleStartBattle(stage)}
              />
            ))}

            {error && (
              <p className="text-red-600 text-sm font-bold uppercase text-center">{error}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Add story overlay layer to Play.tsx**

Add imports at top of `apps/web/src/pages/Play.tsx` (line 1-3), then wrap the game-over section with VictoryScreen. Replace lines 1-96 with:

```tsx
import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { apiAny, useConvexQuery, useConvexMutation } from "@/lib/convexHelpers";
import { VictoryScreen } from "@/components/story";

type MatchMeta = {
  status: string;
  hostId: string;
  awayId: string;
  mode: string;
  isAIOpponent?: boolean;
  winner?: string;
};

export function Play() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const meta = useConvexQuery(
    apiAny.game.getMatchMeta,
    matchId ? { matchId } : "skip",
  ) as MatchMeta | null | undefined;

  const viewJson = useConvexQuery(
    apiAny.game.getPlayerView,
    matchId ? { matchId, seat: "host" as const } : "skip",
  ) as string | null | undefined;

  const submitAction = useConvexMutation(apiAny.game.submitAction);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const view = viewJson ? tryParse(viewJson) : null;
  const gameOver = view?.gameOver;
  const isMyTurn = view?.currentTurnPlayer === "host";
  const currentPhase = view?.phase;

  const handleAction = useCallback(
    async (command: Record<string, unknown>) => {
      if (!matchId || submitting) return;
      setSubmitting(true);
      setError("");

      try {
        await submitAction({
          matchId,
          command: JSON.stringify(command),
          seat: "host" as const,
        });
      } catch (err: any) {
        setError(err.message ?? "Action failed.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, submitAction, submitting],
  );

  const endTurn = () => handleAction({ type: "END_TURN" });
  const advancePhase = () => handleAction({ type: "ADVANCE_PHASE" });

  // Loading
  if (!matchId) return <CenterMessage>No match ID.</CenterMessage>;
  if (meta === undefined || viewJson === undefined) return <Loading />;
  if (meta === null) return <CenterMessage>Match not found.</CenterMessage>;

  // Game over — use VictoryScreen for story mode, simple screen otherwise
  if (gameOver || meta.status === "completed") {
    const won = meta.winner === meta.hostId;
    const isStory = meta.mode === "story";

    if (isStory) {
      return (
        <VictoryScreen
          won={won}
          starsEarned={won ? 1 : 0}
          storyPath="/story"
        />
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfb]">
        <div className="paper-panel p-12 text-center max-w-md">
          <h1
            className="text-5xl mb-4"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
          >
            {won ? "VICTORY" : "DEFEAT"}
          </h1>
          <p
            className="text-sm text-[#666] mb-8"
            style={{ fontFamily: "Special Elite, cursive" }}
          >
            {won
              ? "You proved your worth at the table."
              : "The hallway isn't done with you yet."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/story")}
            className="tcg-button-primary px-8 py-3 text-lg"
          >
            BACK TO STORY
          </button>
        </div>
      </div>
    );
  }

  // ... rest of active game board unchanged (lines 98-328 stay as-is)
```

**Note**: The active game board section (lines 98-328 of original Play.tsx) remains exactly as-is. Only the imports, `useEffect` removal, and game-over section change.

**Step 5: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 6: Commit**

```bash
git add apps/web/src/components/story/index.ts apps/web/src/pages/Story.tsx apps/web/src/pages/StoryChapter.tsx apps/web/src/pages/Play.tsx
git commit -m "feat(story): wire components into pages — Story, StoryChapter, and Play now use story components"
```

---

### Task 9: Agent Story API — JSON Narrative Endpoints

**Files:**
- Modify: `convex/game.ts` (add `getStageWithNarrative` query)
- Modify: `convex/http.ts` (add story progress + narrative endpoints)
- Modify: `apps/web/src/lib/iframe.ts` (add story postMessage types)

**Step 1: Add narrative query to game.ts**

Add after `getStageProgress` (after line 174 in `convex/game.ts`):

```typescript
export const getStageWithNarrative = query({
  args: { chapterId: v.string(), stageNumber: v.number() },
  handler: async (ctx, args) => {
    const stages = await story.stages.getStages(ctx, args.chapterId);
    const stage = (stages as any[])?.find(
      (s: any) => s.stageNumber === args.stageNumber,
    );
    if (!stage) return null;
    return {
      ...stage,
      narrative: {
        preMatchDialogue: stage.preMatchDialogue ?? [],
        postMatchWinDialogue: stage.postMatchWinDialogue ?? [],
        postMatchLoseDialogue: stage.postMatchLoseDialogue ?? [],
      },
    };
  },
});

export const getFullStoryProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const allChapters = await story.chapters.getChapters(ctx, { status: "published" });
    const chapterProgress = await story.progress.getProgress(ctx, user._id);
    const allStageProgress = await story.progress.getStageProgress(ctx, user._id);
    const totalStars = ((allStageProgress as any[]) ?? []).reduce(
      (sum: number, p: any) => sum + (p.starsEarned ?? 0),
      0,
    );
    return {
      chapters: allChapters,
      chapterProgress,
      stageProgress: allStageProgress,
      totalStars,
    };
  },
});
```

**Step 2: Add agent story endpoints to http.ts**

Add before the `export default cors.http;` line in `convex/http.ts`:

```typescript
// ── Agent Story Endpoints ──────────────────────────────────────

cors.route({
  path: "/api/agent/story/progress",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const result = await ctx.runQuery(api.game.getFullStoryProgress, {});
    return jsonResponse(result);
  }),
});

cors.route({
  path: "/api/agent/story/stage",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const url = new URL(request.url);
    const chapterId = url.searchParams.get("chapterId");
    const stageNumber = url.searchParams.get("stageNumber");

    if (!chapterId || !stageNumber) {
      return errorResponse("chapterId and stageNumber query params required.");
    }

    const stage = await ctx.runQuery(api.game.getStageWithNarrative, {
      chapterId,
      stageNumber: parseInt(stageNumber, 10),
    });

    if (!stage) return errorResponse("Stage not found", 404);
    return jsonResponse(stage);
  }),
});
```

**Step 3: Add story postMessage types to iframe.ts**

Add to the `GameToHost` type union in `apps/web/src/lib/iframe.ts` (after line 13):

```typescript
  | { type: "STORY_CUTSCENE"; cutsceneId: string; src: string }
  | { type: "STORY_DIALOGUE"; speaker: string; text: string; avatar?: string }
  | { type: "STAGE_COMPLETE"; stageId: string; stars: number; rewards: { gold?: number; xp?: number } }
```

Add to the `HostToGame` type union (after line 19):

```typescript
  | { type: "SKIP_CUTSCENE" }
```

**Step 4: Verify build**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build 2>&1 | head -30`

**Step 5: Commit**

```bash
git add convex/game.ts convex/http.ts apps/web/src/lib/iframe.ts
git commit -m "feat(story): add agent story API endpoints with JSON narrative payloads and iframe story messages"
```

---

### Task 10: Verify Full Build + Manual Smoke Test

**Step 1: Full build check**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run --filter web build`
Expected: Clean build, no errors

**Step 2: Run dev server**

Run: `cd /Users/home/Desktop/LTCG-v2 && bun run dev:web`

**Step 3: Manual smoke test checklist**
- [ ] Navigate to `/story` — see comic panel grid with Chapter 1
- [ ] Click Chapter 1 — see 3 stages with StagePanel components
- [ ] Stages show difficulty badges and opponent names
- [ ] Click "Fight" on Stage 1 — battle transition + navigate to `/play/:matchId`
- [ ] Play until game over — see VictoryScreen with animated stars
- [ ] "BACK TO MAP" returns to `/story`
- [ ] TrayNav visible on Story and StoryChapter pages

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(story): address smoke test issues"
```

---

## File Summary

### New files (8)
```
apps/web/src/components/story/StoryProvider.tsx
apps/web/src/components/story/DialogueBox.tsx
apps/web/src/components/story/StoryIntro.tsx
apps/web/src/components/story/ChapterMap.tsx
apps/web/src/components/story/StagePanel.tsx
apps/web/src/components/story/BattleTransition.tsx
apps/web/src/components/story/VictoryScreen.tsx
apps/web/src/components/story/index.ts
```

### Modified files (5)
```
apps/web/src/pages/Story.tsx          → thin shell
apps/web/src/pages/StoryChapter.tsx   → thin shell + StagePanel
apps/web/src/pages/Play.tsx           → VictoryScreen integration
apps/web/src/globals.css              → comic panel + stamp CSS
convex/game.ts                        → narrative queries
convex/http.ts                        → agent story endpoints
apps/web/src/lib/iframe.ts            → story postMessage types
```
