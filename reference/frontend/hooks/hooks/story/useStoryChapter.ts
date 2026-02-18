"use client";

import { useAuth } from "@/hooks/auth/useConvexAuthHook";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useStoryChapter(chapterId: string) {
  const [actNumber, chapterNumber] = chapterId.split("-").map(Number);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const currentUser = useConvexQuery(
    typedApi.core.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  const chapterDetails = useConvexQuery(
    typedApi.progression.story.getChapterDetails,
    isAuthenticated && actNumber && chapterNumber ? { actNumber, chapterNumber } : "skip"
  );

  type StageData = {
    stageNumber: number;
    name: string;
    description: string;
    rewardGold: number;
    rewardXp: number;
    firstClearBonus: number;
    firstClearClaimed: boolean;
    aiDifficulty: string;
    status: string;
  };

  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const initializeStageProgress = useConvexMutation(
    typedApi.progression.storyStages.initializeChapterStageProgress
  );

  const initializeStoryBattle = useConvexMutation(
    typedApi.progression.storyBattle.initializeStoryBattle
  );

  // Initialize stage progress when chapter loads
  useEffect(() => {
    if (chapterDetails?._id) {
      type StageWithProgress = { status?: string; timesCompleted?: number };
      const stages = chapterDetails.stages as StageWithProgress[] | undefined;
      const hasProgress = stages?.some((s) => s.status !== "locked" || (s.timesCompleted ?? 0) > 0);
      if (!hasProgress) {
        initializeStageProgress({ chapterId: chapterDetails._id }).catch(console.error);
      }
    }
  }, [chapterDetails, initializeStageProgress]);

  const handleStageSelect = (stageData: StageData) => {
    if (stageData.status === "locked") {
      toast.error("Complete the previous stage first!");
      return;
    }
    setSelectedStage(stageData);
  };

  const startBattle = useCallback(async () => {
    if (!selectedStage || isStarting) return;

    if (!currentUser?.activeDeckId) {
      const shouldNavigate = confirm(
        "You must select a deck before starting a battle.\n\nWould you like to go to your profile to select a deck?"
      );
      if (shouldNavigate) {
        navigate({ to: "/profile" });
      }
      return;
    }

    setIsStarting(true);
    try {
      const result = await initializeStoryBattle({
        chapterId,
        stageNumber: selectedStage.stageNumber,
      });
      // Navigate to the game board with the lobby ID
      navigate({ to: "/play/$matchId", params: { matchId: result.lobbyId } });
    } catch (error) {
      console.error("Failed to start story battle:", error);
      const message = error instanceof Error ? error.message : "Failed to start battle";
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  }, [selectedStage, isStarting, currentUser, chapterId, initializeStoryBattle, navigate]);

  const isLoading = !currentUser || chapterDetails === undefined;
  const isMissing = !chapterDetails;

  return {
    chapterDetails,
    selectedStage,
    setSelectedStage,
    handleStageSelect,
    startBattle,
    isLoading,
    isMissing,
    currentUser,
  };
}
