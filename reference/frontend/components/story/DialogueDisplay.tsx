"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FastForward, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface DialogueLine {
  speaker: string;
  text: string;
  imageUrl?: string;
}

interface DialogueDisplayProps {
  lines: DialogueLine[];
  onComplete: () => void;
  title?: string;
  autoAdvanceDelay?: number; // ms, 0 = no auto advance
}

export function DialogueDisplay({
  lines,
  onComplete,
  title,
  autoAdvanceDelay = 0,
}: DialogueDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const currentLine = lines[currentIndex];
  const isLastLine = currentIndex === lines.length - 1;
  const typeSpeed = 30; // ms per character

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setIsTyping(true);
    setDisplayedText("");

    let charIndex = 0;
    const text = currentLine.text;

    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, typeSpeed);

    return () => clearInterval(typeInterval);
  }, [currentIndex, currentLine]);

  // Auto-advance
  useEffect(() => {
    if (autoAdvanceDelay > 0 && !isTyping) {
      const timeout = setTimeout(() => {
        if (isLastLine) {
          onComplete();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, autoAdvanceDelay);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isTyping, autoAdvanceDelay, isLastLine, onComplete]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      // Skip typing animation - show full text
      setDisplayedText(currentLine?.text || "");
      setIsTyping(false);
    } else if (isLastLine) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isTyping, isLastLine, onComplete, currentLine]);

  const handleSkipAll = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        handleAdvance();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkipAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdvance, handleSkipAll]);

  if (!currentLine) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none" />

      {/* Main dialogue container */}
      <div className="relative w-full max-w-4xl mx-4 mb-8">
        {/* Title banner */}
        {title && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2"
          >
            <div className="px-6 py-2 bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent">
              <span className="text-[#d4af37] font-bold text-lg tracking-wider uppercase">
                {title}
              </span>
            </div>
          </motion.div>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center gap-1.5 mb-3">
          {lines.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-[#d4af37] scale-125"
                  : index < currentIndex
                    ? "bg-[#d4af37]/50"
                    : "bg-gray-600"
              )}
            />
          ))}
        </div>

        {/* Dialogue box */}
        <div
          className="relative overflow-hidden cursor-pointer zine-border bg-card"
          onClick={handleAdvance}
        >
          <div className="flex gap-6 p-6">
            {/* Character portrait */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLine.speaker}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="shrink-0"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#d4af37]/50 bg-gradient-to-br from-gray-800 to-gray-900">
                  {currentLine.imageUrl ? (
                    <Image
                      src={currentLine.imageUrl}
                      alt={currentLine.speaker}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-[#d4af37]/50" />
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Speaker name */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentLine.speaker}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2"
                >
                  <span className="text-[#d4af37] font-bold text-lg">{currentLine.speaker}</span>
                </motion.div>
              </AnimatePresence>

              {/* Dialogue text */}
              <div className="min-h-[4rem]">
                <p className="text-[#e8e0d5] text-base md:text-lg leading-relaxed">
                  {displayedText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                      className="inline-block w-0.5 h-5 ml-0.5 bg-[#d4af37] align-middle"
                    />
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action hints */}
          <div className="flex items-center justify-between px-6 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSkipAll();
              }}
              className="text-[#a89f94] hover:text-[#e8e0d5] hover:bg-transparent"
            >
              <FastForward className="w-4 h-4 mr-1" />
              Skip
            </Button>

            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="flex items-center gap-1 text-[#a89f94] text-sm"
            >
              {isTyping ? (
                "Click to skip"
              ) : isLastLine ? (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
