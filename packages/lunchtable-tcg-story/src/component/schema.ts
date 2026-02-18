import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { literals } from "convex-helpers/validators";

const difficultyValidator = literals("normal", "hard", "legendary");
const progressStatusValidator = literals("locked", "available", "in_progress", "completed");

export default defineSchema({
  storyProgress: defineTable({
    userId: v.string(), // external ref
    actNumber: v.number(),
    chapterNumber: v.number(),
    difficulty: difficultyValidator,
    status: progressStatusValidator,
    starsEarned: v.number(),
    bestScore: v.optional(v.number()),
    timesAttempted: v.number(),
    timesCompleted: v.number(),
    firstCompletedAt: v.optional(v.number()),
    lastAttemptedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_chapter", ["userId", "actNumber", "chapterNumber"])
    .index("by_user_difficulty", ["userId", "difficulty", "status"])
    .index("by_user_status", ["userId", "status"]),

  storyBattleAttempts: defineTable({
    userId: v.string(), // external ref
    progressId: v.id("storyProgress"), // intra-component
    actNumber: v.number(),
    chapterNumber: v.number(),
    difficulty: difficultyValidator,
    outcome: literals("won", "lost", "abandoned"),
    starsEarned: v.number(),
    finalLP: v.number(),
    rewardsEarned: v.object({
      gold: v.number(),
      xp: v.number(),
      cards: v.optional(v.array(v.string())),
    }),
    attemptedAt: v.number(),
  })
    .index("by_user_time", ["userId", "attemptedAt"])
    .index("by_progress", ["progressId", "attemptedAt"])
    .index("by_user_chapter", ["userId", "actNumber", "chapterNumber"])
    .index("by_user_difficulty_time", ["userId", "difficulty", "attemptedAt"]),

  storyChapters: defineTable({
    number: v.optional(v.number()),
    actNumber: v.optional(v.number()),
    chapterNumber: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    archetype: v.optional(v.string()),
    storyText: v.optional(v.string()),
    aiOpponentDeckCode: v.optional(v.string()),
    aiDifficulty: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard"),
        v.literal("boss"),
        v.object({
          normal: v.number(),
          hard: v.number(),
          legendary: v.number(),
        })
      )
    ),
    battleCount: v.optional(v.number()),
    archetypeImageUrl: v.optional(v.string()),
    baseRewards: v.optional(
      v.object({
        gold: v.number(),
        xp: v.number(),
        gems: v.optional(v.number()),
      })
    ),
    unlockCondition: v.optional(
      v.object({
        type: literals("chapter_complete", "player_level", "none"),
        requiredChapterId: v.optional(v.string()), // use v.string() to be safe in nested object
        requiredLevel: v.optional(v.number()),
      })
    ),
    loreText: v.optional(v.string()),
    unlockRequirements: v.optional(
      v.object({
        previousChapter: v.optional(v.boolean()),
        minimumLevel: v.optional(v.number()),
      })
    ),
    isActive: v.optional(v.boolean()),
    status: v.optional(literals("draft", "published")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_number", ["number"])
    .index("by_status", ["status"])
    .index("by_act_chapter", ["actNumber", "chapterNumber"]),

  storyStages: defineTable({
    chapterId: v.id("storyChapters"), // intra-component
    stageNumber: v.number(),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.string(),
    opponentName: v.optional(v.string()),
    opponentDeckId: v.optional(v.string()), // external ref
    opponentDeckArchetype: v.optional(v.string()),
    difficulty: v.optional(literals("easy", "medium", "hard", "boss")),
    aiDifficulty: v.optional(literals("easy", "medium", "hard", "boss")),
    preMatchDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string(), imageUrl: v.optional(v.string()) }))
    ),
    postMatchWinDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string() }))
    ),
    postMatchLoseDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string() }))
    ),
    rewardGold: v.optional(v.number()),
    rewardXp: v.optional(v.number()),
    firstClearBonus: v.optional(
      v.union(
        v.object({
          gold: v.optional(v.number()),
          xp: v.optional(v.number()),
          gems: v.optional(v.number()),
        }),
        v.number()
      )
    ),
    firstClearGold: v.optional(v.number()),
    repeatGold: v.optional(v.number()),
    firstClearGems: v.optional(v.number()),
    cardRewardId: v.optional(v.string()), // external ref
    status: v.optional(literals("draft", "published")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_chapter", ["chapterId", "stageNumber"])
    .index("by_status", ["status"]),

  storyStageProgress: defineTable({
    userId: v.string(), // external ref
    stageId: v.id("storyStages"), // intra-component
    chapterId: v.id("storyChapters"), // intra-component
    stageNumber: v.number(),
    status: literals("locked", "available", "completed", "starred"),
    starsEarned: v.number(),
    bestScore: v.optional(v.number()),
    timesCompleted: v.number(),
    firstClearClaimed: v.boolean(),
    lastCompletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_stage", ["userId", "stageId"])
    .index("by_user_chapter", ["userId", "chapterId"]),
});
