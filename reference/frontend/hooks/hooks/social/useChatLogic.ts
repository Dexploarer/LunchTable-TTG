"use client";

import { useGuildChat } from "@/hooks/guilds/useGuildChat";
import type { Id } from "@convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";

export function useChatLogic(guildId: Id<"guilds">) {
  const { messages, isLoading, sendMessage, canLoadMore, loadMore } = useGuildChat(guildId);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const prevScrollHeightRef = useRef<number>(0);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      return;
    }
    scrollToBottom();
  }, [messages?.length, isLoading, scrollToBottom]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !canLoadMore || isLoadingMore) return;

    if (container.scrollTop < 100) {
      setIsLoadingMore(true);
      prevScrollHeightRef.current = container.scrollHeight;

      loadMore();

      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = scrollDiff;
        }
        setIsLoadingMore(false);
      });
    }
  }, [canLoadMore, isLoadingMore, loadMore]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage("");
    } catch {
      // Error handled by hook
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    messages,
    isLoading,
    message,
    setMessage,
    isSending,
    isLoadingMore,
    messagesEndRef,
    messagesContainerRef,
    handleScroll,
    handleSend,
    handleKeyDown,
    canLoadMore,
  };
}
