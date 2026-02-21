"use client";

import { Image } from "@/components/ui/image";
import { getArchetypeTheme } from "@/lib/archetypeThemes";
import { getAssetUrl } from "@/lib/blob";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Lock, Star, Trophy } from "lucide-react";

interface StoryChapterCardProps {
  chapter: {
    chapterId: string;
    name: string;
    description: string;
    archetype: string;
    order: number;
    requiredLevel: number;
    isUnlocked: boolean;
    completedStages: number;
    totalStages: number;
    starredStages: number;
    isCompleted: boolean;
  };
  onClick?: () => void;
}

export function StoryChapterCard({ chapter, onClick }: StoryChapterCardProps) {
  const assetName = chapter.archetype; // Use the chapter's archetype for the background
  const isUnlocked = chapter.isUnlocked;
  const isCompleted = chapter.isCompleted;
  const chapterName = chapter.name;
  const chapterDescription = chapter.description;
  const totalStages = chapter.totalStages;
  const completedStages = chapter.completedStages;

  // Get archetype-specific theme for visual styling
  const archetypeTheme = getArchetypeTheme(chapter.archetype);

  return (
    <motion.button
      data-testid="story-chapter"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full h-64 text-left group transition-all duration-300",
        !isUnlocked && "opacity-80 grayscale"
      )}
    >
      <div className="h-full overflow-hidden zine-border bg-card">
        {/* Background Image */}
        <div className="absolute inset-0" data-testid="chapter-artwork">
          <Image
            src={getAssetUrl(`/assets/story/${assetName}.png`)}
            alt={chapterName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-90" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 z-10">
          {/* Top Right Status */}
          <div className="absolute top-4 right-4">
            {!isUnlocked ? (
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
            ) : isCompleted ? (
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
            ) : null}
          </div>

          {/* Chapter Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border",
                  archetypeTheme.borderColor
                )}
              >
                <Image
                  src={archetypeTheme.iconPath}
                  alt={chapter.archetype}
                  width={16}
                  height={16}
                  className="rounded-sm"
                />
                <span>Chapter {chapter.order}</span>
              </span>
              {isUnlocked && (
                <div
                  className="flex items-center gap-1 text-xs text-yellow-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10"
                  data-testid="stage-stars"
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>{chapter.starredStages}</span>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white group-hover:text-purple-200 transition-colors">
              {chapterName}
            </h3>

            <p className="text-sm text-gray-300 line-clamp-2 min-h-10">
              {!isUnlocked ? `Reach level ${chapter.requiredLevel} to unlock.` : chapterDescription}
            </p>

            {/* Progress Bar */}
            {isUnlocked && (
              <div className="mt-4" data-testid="chapter-progress">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white/80" data-testid="completion-percentage">
                    {Math.round((completedStages / totalStages) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                      isCompleted ? "from-yellow-500 to-amber-300" : archetypeTheme.gradient
                    )}
                    style={{ width: `${(completedStages / totalStages) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
