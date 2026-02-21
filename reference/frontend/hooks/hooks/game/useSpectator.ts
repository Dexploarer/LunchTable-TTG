"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

interface UseSpectatorReturn {
  activeGames:
    | ReturnType<typeof useQuery<typeof api.gameplay.games.queries.listActiveGames>>
    | undefined;
  spectatorView:
    | ReturnType<typeof useQuery<typeof api.gameplay.games.queries.getGameSpectatorView>>
    | undefined;
  isLoading: boolean;
  joinAsSpectator: (lobbyId: Id<"gameLobbies">) => Promise<void>;
  leaveAsSpectator: (lobbyId: Id<"gameLobbies">) => Promise<void>;
}

/**
 * Spectator mode for watching active games in real-time.
 *
 * Allows players to watch ongoing games between other players. Provides
 * spectator-specific game view with both players' boards visible. Must be
 * used inside an Authenticated component.
 *
 * Features:
 * - List all active games available for spectating
 * - Join games as spectator
 * - Leave spectator mode
 * - Real-time game updates for spectators
 * - View both players' boards and hands
 *
 * @example
 * ```typescript
 * // List active games
 * const { activeGames, joinAsSpectator } = useSpectator();
 *
 * activeGames?.forEach(game => {
 *   console.log(`${game.player1} vs ${game.player2}`);
 * });
 *
 * // Join as spectator
 * await joinAsSpectator(lobbyId);
 *
 * // In spectator view component
 * const { spectatorView, leaveAsSpectator } = useSpectator(lobbyId);
 *
 * // Leave spectator mode
 * await leaveAsSpectator(lobbyId);
 * ```
 *
 * @param lobbyId - Optional lobby ID to get spectator view of specific game
 *
 * @returns {UseSpectatorReturn} Spectator interface
 */
export function useSpectator(lobbyId?: Id<"gameLobbies">): UseSpectatorReturn {
  // No auth check needed - use inside <Authenticated>
  const activeGames = useQuery(api.gameplay.games.queries.listActiveGames, {
    mode: "all",
    limit: 50,
  });

  const spectatorView = useQuery(
    api.gameplay.games.queries.getGameSpectatorView,
    lobbyId ? { lobbyId } : "skip"
  );

  // Join/leave as spectator
  const joinMutation = useMutation(api.gameplay.games.spectator.joinAsSpectator);
  const leaveMutation = useMutation(api.gameplay.games.spectator.leaveAsSpectator);

  const joinAsSpectator = async (lobbyId: Id<"gameLobbies">) => {
    try {
      await joinMutation({ lobbyId });
      toast.success("Now spectating game");
    } catch (error) {
      const message = handleHookError(error, "Failed to join as spectator");
      toast.error(message);
      throw error;
    }
  };

  const leaveAsSpectator = async (lobbyId: Id<"gameLobbies">) => {
    try {
      await leaveMutation({ lobbyId });
      toast.info("Stopped spectating");
    } catch (error) {
      const message = handleHookError(error, "Failed to leave spectator mode");
      toast.error(message);
      throw error;
    }
  };

  return {
    activeGames,
    spectatorView,
    isLoading: activeGames === undefined,
    joinAsSpectator,
    leaveAsSpectator,
  };
}
