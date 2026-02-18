"use client";

import { useAuth } from "@/hooks/auth/useConvexAuthHook";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useEffect, useMemo } from "react";

export function useStoryMode() {
  const { isAuthenticated } = useAuth();

  const currentUser = useConvexQuery(
    typedApi.core.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  // Feature flag check
  const { enabled: storyModeEnabled, isLoading: flagsLoading } = useFeatureFlag("storyModeEnabled");

  // Fetch real data
  const allChapters = useConvexQuery(
    typedApi.progression.story.getAvailableChapters,
    isAuthenticated ? {} : "skip"
  );

  const playerProgress = useConvexQuery(
    typedApi.progression.story.getPlayerProgress,
    isAuthenticated ? {} : "skip"
  );

  const initializeStoryProgress = useConvexMutation(
    typedApi.progression.story.initializeStoryProgress
  );

  // Initialize progress on first access
  useEffect(() => {
    if (isAuthenticated && playerProgress && !playerProgress.progressByAct) {
      // No progress exists, initialize it
      initializeStoryProgress({}).catch(console.error);
    }
  }, [isAuthenticated, playerProgress, initializeStoryProgress]);

  // Transform chapter data from database to UI format
  const chapters = useMemo(() => {
    if (!allChapters) return [];

    return allChapters.map(
      (chapter: {
        actNumber: number;
        chapterNumber: number;
        title: string;
        description: string;
        archetype?: string;
        status?: string;
        stagesCompleted?: number;
        totalStages?: number;
        starsEarned?: number;
        isUnlocked?: boolean;
        unlockRequirements?: {
          minimumLevel?: number;
        };
      }) => {
        const chapterId = `${chapter.actNumber}-${chapter.chapterNumber}`;

        // Derive required level from unlock requirements or use default progression
        const requiredLevel =
          chapter.unlockRequirements?.minimumLevel || (chapter.chapterNumber - 1) * 5 + 1;

        return {
          chapterId,
          // Use database title and description directly
          name: chapter.title || `Chapter ${chapter.chapterNumber}`,
          description: chapter.description || "",
          archetype: chapter.archetype || "mixed",
          order: chapter.chapterNumber,
          requiredLevel,
          isUnlocked: chapter.isUnlocked ?? chapter.status !== "locked",
          completedStages: chapter.stagesCompleted || 0,
          totalStages: chapter.totalStages || 10,
          starredStages: chapter.starsEarned || 0,
          isCompleted: chapter.status === "completed",
        };
      }
    );
  }, [allChapters]);

  const stats = useMemo(() => {
    // Use actual chapter count from database
    const totalChapters = allChapters?.length || 0;
    // Each chapter has 10 stages
    const totalStages = totalChapters * 10;

    if (!playerProgress) {
      return {
        completedChapters: 0,
        totalChapters,
        completedStages: 0,
        totalStages,
        starredStages: 0,
      };
    }

    // Calculate completed stages from progress
    let completedStages = 0;
    if (playerProgress.progressByAct) {
      Object.values(playerProgress.progressByAct).forEach((chapters: unknown) => {
        if (!Array.isArray(chapters)) return;
        chapters.forEach((ch: { timesCompleted?: number }) => {
          completedStages += ch.timesCompleted || 0;
        });
      });
    }

    return {
      completedChapters: playerProgress.totalChaptersCompleted || 0,
      totalChapters,
      completedStages,
      totalStages,
      starredStages: playerProgress.totalStarsEarned || 0,
    };
  }, [playerProgress, allChapters]);

  const isLoading = !currentUser || flagsLoading;

  return {
    chapters,
    stats,
    storyModeEnabled,
    isLoading,
    currentUser,
    allChapters, // Exposed for raw data if needed
  };
}
