"use client";

import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { Bot, Brain, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AgentEvent {
  eventId: string;
  turnNumber: number;
  eventType: string;
  playerUsername: string;
  description: string;
  timestamp: number;
  metadata?: {
    phase?: string;
    cardsConsidered?: string[];
    action?: string;
    reasoning?: string;
    error?: string;
    executionTimeMs?: number;
  };
}

interface AgentActivityIndicatorProps {
  lobbyId: Id<"gameLobbies">;
  className?: string;
}

/**
 * Displays real-time elizaOS agent activity during games.
 *
 * Shows when an autonomous AI agent (NOT story mode bots) is:
 * - Thinking (making LLM calls)
 * - Has decided on an action
 * - Encountered an error
 *
 * This provides visibility into real LLM-powered gameplay.
 */
export function AgentActivityIndicator({ lobbyId, className = "" }: AgentActivityIndicatorProps) {
  const [latestEvent, setLatestEvent] = useState<AgentEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Subscribe to agent events only
  const agentEvents = useConvexQuery(typedApi.gameplay.gameEvents.subscribeToGameEvents, {
    lobbyId,
    eventTypes: ["agent_thinking", "agent_decided", "agent_error"],
    limit: 5,
  }) as AgentEvent[] | undefined;

  // Update latest event when new events arrive
  useEffect(() => {
    if (!agentEvents || agentEvents.length === 0) {
      return;
    }

    const newest = agentEvents[agentEvents.length - 1];
    if (!newest) return;

    // Only update if it's a new event
    if (!latestEvent || newest.timestamp > latestEvent.timestamp) {
      setLatestEvent(newest);
      setIsVisible(true);

      // Auto-hide "decided" events after 5 seconds
      if (newest.eventType === "agent_decided" || newest.eventType === "agent_error") {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [agentEvents, latestEvent]);

  // Don't render if no events or not visible
  if (!isVisible || !latestEvent) {
    return null;
  }

  const getIcon = () => {
    switch (latestEvent.eventType) {
      case "agent_thinking":
        return <Brain className="w-5 h-5 animate-pulse" />;
      case "agent_decided":
        return <CheckCircle className="w-5 h-5" />;
      case "agent_error":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (latestEvent.eventType) {
      case "agent_thinking":
        return "bg-blue-500/20 border-blue-500/50 text-blue-400";
      case "agent_decided":
        return "bg-green-500/20 border-green-500/50 text-green-400";
      case "agent_error":
        return "bg-red-500/20 border-red-500/50 text-red-400";
      default:
        return "bg-gray-500/20 border-gray-500/50 text-gray-400";
    }
  };

  const getStatusText = () => {
    switch (latestEvent.eventType) {
      case "agent_thinking":
        return "Thinking...";
      case "agent_decided":
        return "Decided";
      case "agent_error":
        return "Error";
      default:
        return "Active";
    }
  };

  return (
    <div
      className={`
        fixed top-20 right-4 z-50
        max-w-sm p-4 rounded-xl
        border backdrop-blur-sm
        transition-all duration-300
        ${getStatusColor()}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/20">{getIcon()}</div>
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="font-semibold text-sm">{latestEvent.playerUsername}</span>
          </div>
          <span className="text-xs opacity-70">{getStatusText()}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm opacity-90 mb-2">{latestEvent.description}</p>

      {/* Metadata */}
      {latestEvent.metadata && (
        <div className="text-xs opacity-70 space-y-1">
          {latestEvent.metadata.action && (
            <p>
              <span className="font-medium">Action:</span> {latestEvent.metadata.action}
            </p>
          )}
          {latestEvent.metadata.reasoning && (
            <p className="line-clamp-2">
              <span className="font-medium">Reasoning:</span> {latestEvent.metadata.reasoning}
            </p>
          )}
          {latestEvent.metadata.executionTimeMs && (
            <p>
              <span className="font-medium">Time:</span> {latestEvent.metadata.executionTimeMs}ms
            </p>
          )}
          {latestEvent.metadata.cardsConsidered &&
            latestEvent.metadata.cardsConsidered.length > 0 && (
              <p>
                <span className="font-medium">Considering:</span>{" "}
                {latestEvent.metadata.cardsConsidered.join(", ")}
              </p>
            )}
          {latestEvent.metadata.error && (
            <p className="text-red-300">
              <span className="font-medium">Error:</span> {latestEvent.metadata.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
