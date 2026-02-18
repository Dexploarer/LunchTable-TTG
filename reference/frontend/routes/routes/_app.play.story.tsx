"use client";

import { StoryChapterCard } from "@/components/story/StoryChapterCard";
import { useStoryMode } from "@/hooks/story/useStoryMode";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app/play/story")({
  component: StoryChapterListPage,
});

function StoryChapterListPage() {
  const navigate = useNavigate();
  const { chapters, stats, isLoading } = useStoryMode();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
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

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="text-center sm:text-left mb-12">
          <h1 className="text-6xl font-black text-black uppercase tracking-tighter ink-bleed-advanced relative z-10">
            Story Mode
          </h1>
          <p className="text-primary/60 font-bold uppercase tracking-widest text-sm mt-2 border-l-4 border-primary pl-4">
            Battle the CPU. Master each chapter.
          </p>
        </div>

        {/* Stats Bar */}
        {stats.totalChapters > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-white border-zine shadow-zine ink-wash"
          >
            <div className="flex items-center justify-around gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xl font-black text-black">
                    {stats.completedChapters}/{stats.totalChapters}
                  </div>
                  <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider">
                    Chapters
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-xl font-black text-black">
                    {stats.completedStages}/{stats.totalStages}
                  </div>
                  <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider">
                    Stages
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <div>
                  <div className="text-xl font-black text-black">{stats.starredStages}</div>
                  <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider">
                    Stars
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Chapter Grid */}
        {chapters.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 border-zine rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-6">
              <BookOpen className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">
              No Chapters Available
            </h3>
            <p className="text-black/60 font-bold max-w-sm mx-auto">
              Story chapters haven't been added yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.chapterId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StoryChapterCard
                  chapter={chapter}
                  onClick={() => {
                    if (chapter.isUnlocked) {
                      navigate({
                        to: "/play/story/$chapterId",
                        params: { chapterId: chapter.chapterId },
                      });
                    }
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
