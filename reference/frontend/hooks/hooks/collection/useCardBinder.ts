"use client";

import { typedApi, useQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseCardBinderReturn {
  userCards: any[] | undefined;
  favoriteCards: any[] | undefined;
  collectionStats: any | undefined;
  isLoading: boolean;
  toggleFavorite: (playerCardId: Id<"playerCards">) => Promise<void>;
}

/**
 * Card collection viewer and management (the "binder").
 */
export function useCardBinder(): UseCardBinderReturn {
  const { isAuthenticated } = useAuth();

  // Fetch current user details to get the userId for queries
  const currentUser = useQuery(typedApi.core.users.currentUser, isAuthenticated ? {} : "skip");

  const userId = currentUser?._id;

  // TanStack Queries (using useConvexQuery)
  const userCards = useQuery(
    typedApi.lunchtable_tcg_cards.cards.getUserCards,
    userId ? { userId } : "skip"
  );

  const favoriteCards = useQuery(
    typedApi.lunchtable_tcg_cards.cards.getUserFavoriteCards,
    userId ? { userId } : "skip"
  );

  const collectionStats = useQuery(
    typedApi.lunchtable_tcg_cards.cards.getCollectionStats,
    userId ? { userId } : "skip"
  );

  // Mutation
  const toggleFavoriteMutation = useMutation(
    (api as any).lunchtable_tcg_cards.cards.toggleFavorite
  );

  const toggleFavorite = async (playerCardId: Id<"playerCards">) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      await toggleFavoriteMutation({ playerCardId, userId });
    } catch (error) {
      const message = handleHookError(error, "Failed to toggle favorite");
      toast.error(message);
      throw error;
    }
  };

  return {
    userCards,
    favoriteCards,
    collectionStats,
    isLoading:
      currentUser === undefined ||
      userCards === undefined ||
      favoriteCards === undefined ||
      collectionStats === undefined,
    toggleFavorite,
  };
}
