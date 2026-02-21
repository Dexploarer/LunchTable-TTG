"use client";

import { Button } from "@/components/ui/button";
import { useStoryChapter } from "@/hooks/story/useStoryChapter";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Lock,
  Play,
  Star,
  Swords,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_app/play/story/$chapterId")({
  component: StoryChapterDetailPage,
});

function StoryChapterDetailPage() {
  const { chapterId } = Route.useParams();
  const navigate = useNavigate();
  const {
    chapterDetails,
    selectedStage,
    handleStageSelect,
    startBattle,
    isLoading,
    isMissing,
  } = useStoryChapter(chapterId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (isMissing || !chapterDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background scanner-noise gap-4">
        <h2 className="text-2xl font-black text-black uppercase">Chapter Not Found</h2>
        <p className="text-black/60 font-bold">This chapter doesn't exist or hasn't been unlocked.</p>
        <Link
          to="/play/story"
          className="text-primary font-bold uppercase underline underline-offset-4"
        >
          Back to Story
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scanner-noise pt-12">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23121212' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        {/* Back Link */}
        <Link
          to="/play/story"
          className="inline-flex items-center gap-2 text-sm font-black text-black/60 uppercase tracking-wider hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Chapters
        </Link>

        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter ink-bleed-advanced">
            {chapterDetails.title}
          </h1>
          {chapterDetails.description && (
            <p className="text-primary/60 font-bold mt-2 max-w-2xl">
              {chapterDetails.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stage List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xl font-black text-black uppercase tracking-tighter mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Stages
            </h2>

            {chapterDetails.stages?.map((stage: any, index: number) => {
              const isLocked = stage.status === "locked";
              const isCompleted = stage.status === "completed" || stage.status === "starred";
              const isSelected = selectedStage?.stageNumber === stage.stageNumber;

              return (
                <motion.button
                  key={stage._id ?? index}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStageSelect(stage)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 border-zine text-left transition-all",
                    isLocked
                      ? "opacity-50 cursor-not-allowed bg-slate-50"
                      : isSelected
                        ? "bg-primary/5 shadow-zine -translate-y-0.5 border-primary/30"
                        : "bg-white shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5"
                  )}
                >
                  {/* Stage Number */}
                  <div
                    className={cn(
                      "w-10 h-10 flex items-center justify-center border-zine font-black text-lg shrink-0",
                      isLocked
                        ? "bg-slate-200 text-slate-400"
                        : isCompleted
                          ? "bg-amber-100 text-amber-700"
                          : "bg-white text-black"
                    )}
                  >
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : isCompleted ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      stage.stageNumber
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-black uppercase truncate text-sm">
                      {stage.name || `Stage ${stage.stageNumber}`}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-black/50 uppercase">
                      <span>vs {stage.opponentName ?? "CPU"}</span>
                      <span className="capitalize">{stage.aiDifficulty}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  {!isLocked && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3.5 h-3.5",
                            star <= (stage.starsEarned ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  <ChevronRight
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isSelected ? "text-primary" : "text-black/30"
                    )}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Selected Stage Detail Panel */}
          <div className="lg:col-span-1">
            {selectedStage ? (
              <motion.div
                key={selectedStage.stageNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white border-zine shadow-zine ink-wash sticky top-24"
              >
                <h3 className="text-lg font-black text-black uppercase tracking-tight mb-4">
                  {selectedStage.name || `Stage ${selectedStage.stageNumber}`}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-black/60">Difficulty</span>
                    <span className="font-black text-black uppercase">
                      {selectedStage.aiDifficulty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-black/60">Reward</span>
                    <span className="font-black text-amber-600">
                      {selectedStage.rewardGold} Gold / {selectedStage.rewardXp} XP
                    </span>
                  </div>
                  {!selectedStage.firstClearClaimed && selectedStage.firstClearBonus > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-black/60">First Clear</span>
                      <span className="font-black text-purple-600">
                        +{selectedStage.firstClearBonus} Bonus
                      </span>
                    </div>
                  )}
                  {selectedStage.starsEarned > 0 && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="font-bold text-black/60">Best</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "w-4 h-4",
                              s <= selectedStage.starsEarned
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={startBattle}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-wider border-2 border-primary shadow-zine hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-zine-sm transition-all"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Battle
                </Button>
              </motion.div>
            ) : (
              <div className="p-6 bg-white border-zine shadow-zine ink-wash text-center">
                <Swords className="w-8 h-8 text-black/20 mx-auto mb-3" />
                <p className="font-bold text-black/40 text-sm">
                  Select a stage to see details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
