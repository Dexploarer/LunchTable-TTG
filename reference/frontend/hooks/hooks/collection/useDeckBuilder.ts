"use client";

import { api } from "@/lib/convexApiWrapper";
import { typedApi, useQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseDeckBuilderReturn {
  decks: any;
  isLoading: boolean;
  createDeck: (name: string) => Promise<Id<"userDecks">>;
  saveDeck: (
    deckId: Id<"userDecks">,
    cards: Array<{ cardDefinitionId: Id<"cardDefinitions">; quantity: number }>
  ) => Promise<void>;
  renameDeck: (deckId: Id<"userDecks">, newName: string) => Promise<void>;
  deleteDeck: (deckId: Id<"userDecks">) => Promise<void>;
  duplicateDeck: (deckId: Id<"userDecks">, newName?: string) => Promise<Id<"userDecks">>;
  setActiveDeck: (deckId: Id<"userDecks">) => Promise<void>;
}

/**
 * Deck building and management hook with complete CRUD operations.
 *
 * Provides all functionality needed to create, modify, and manage player decks.
 * Includes validation, duplication, and active deck selection. All mutations
 * show toast notifications for user feedback.
 *
 * Features:
 * - Create new decks with custom names
 * - Save deck composition (card list with quantities)
 * - Rename existing decks
 * - Delete decks
 * - Duplicate decks with automatic naming
 * - Set active deck for gameplay
 *
 * @example
 * ```typescript
 * const {
 *   decks,
 *   isLoading,
 *   createDeck,
 *   saveDeck,
 *   setActiveDeck
 * } = useDeckBuilder();
 *
 * // Create a new deck
 * const deckId = await createDeck("My Dragon Deck");
 *
 * // Save cards to deck
 * await saveDeck(deckId, [
 *   { cardDefinitionId: card1Id, quantity: 3 },
 *   { cardDefinitionId: card2Id, quantity: 2 }
 * ]);
 *
 * // Set as active deck
 * await setActiveDeck(deckId);
 * ```
 *
 * @returns {Object} Deck builder interface containing:
 * - `decks` - Array of user's decks (basic info)
 * - `isLoading` - Loading state boolean
 * - `createDeck(name)` - Create new deck, returns deck ID
 * - `saveDeck(deckId, cards)` - Save card composition to deck
 * - `renameDeck(deckId, newName)` - Rename a deck
 * - `deleteDeck(deckId)` - Delete a deck
 * - `duplicateDeck(deckId, newName?)` - Duplicate deck, returns new deck ID
 * - `setActiveDeck(deckId)` - Set deck as active for gameplay
 *
 * @throws {Error} When user is not authenticated
 */
export function useDeckBuilder(): UseDeckBuilderReturn {
  const { isAuthenticated } = useAuth();

  // Fetch current user details
  const currentUser = useQuery(typedApi.core.users.currentUser, isAuthenticated ? {} : "skip");

  const userId = currentUser?._id;

  // Queries
  const decks = useQuery(
    (api as any).lunchtable_tcg_cards.decks.getUserDecks,
    userId ? { userId } : "skip"
  );

  // Mutations
  const createMutation = useMutation((api as any).lunchtable_tcg_cards.decks.createDeck);
  const saveMutation = useMutation((api as any).lunchtable_tcg_cards.decks.saveDeck);
  const renameMutation = useMutation((api as any).lunchtable_tcg_cards.decks.renameDeck);
  const deleteMutation = useMutation((api as any).lunchtable_tcg_cards.decks.deleteDeck);
  const duplicateMutation = useMutation((api as any).lunchtable_tcg_cards.decks.duplicateDeck);
  const setActiveMutation = useMutation((api as any).lunchtable_tcg_cards.decks.setActiveDeck);

  // Actions
  const createDeck = async (name: string) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      const result = await createMutation({ userId, name });
      toast.success(`Deck "${name}" created`);
      return result.deckId;
    } catch (error) {
      const message = handleHookError(error, "Failed to create deck");
      toast.error(message);
      throw error;
    }
  };

  const saveDeck = async (
    deckId: Id<"userDecks">,
    cards: Array<{ cardDefinitionId: Id<"cardDefinitions">; quantity: number }>
  ) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      await saveMutation({ userId, deckId, cards });
      toast.success("Deck saved");
    } catch (error) {
      const message = handleHookError(error, "Failed to save deck");
      toast.error(message);
      throw error;
    }
  };

  const renameDeck = async (deckId: Id<"userDecks">, newName: string) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      await renameMutation({ userId, deckId, newName });
      toast.success(`Deck renamed to "${newName}"`);
    } catch (error) {
      const message = handleHookError(error, "Failed to rename deck");
      toast.error(message);
      throw error;
    }
  };

  const deleteDeck = async (deckId: Id<"userDecks">) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      await deleteMutation({ userId, deckId });
      toast.success("Deck deleted");
    } catch (error) {
      const message = handleHookError(error, "Failed to delete deck");
      toast.error(message);
      throw error;
    }
  };

  const duplicateDeck = async (deckId: Id<"userDecks">, newName?: string) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      // Find source deck to generate a name if not provided
      const sourceDeck = decks?.find((d: any) => d.id === deckId);
      const duplicateName = newName || (sourceDeck ? `${sourceDeck.name} (Copy)` : "Deck Copy");

      const result = await duplicateMutation({
        userId,
        newName: duplicateName,
        sourceDeckId: deckId,
      });
      toast.success("Deck duplicated");
      return result.deckId;
    } catch (error) {
      const message = handleHookError(error, "Failed to duplicate deck");
      toast.error(message);
      throw error;
    }
  };

  const setActiveDeck = async (deckId: Id<"userDecks">) => {
    if (!isAuthenticated || !userId) throw new Error("Not authenticated");
    try {
      await setActiveMutation({ userId, deckId });
      toast.success("Active deck updated");
    } catch (error) {
      const message = handleHookError(error, "Failed to set active deck");
      toast.error(message);
      throw error;
    }
  };

  return {
    // Data
    decks,
    isLoading: currentUser === undefined || decks === undefined,

    // Actions
    createDeck,
    saveDeck,
    renameDeck,
    deleteDeck,
    duplicateDeck,
    setActiveDeck,
  };
}

/**
 * Retrieves detailed information for a specific deck including all cards.
 *
 * This hook must be called at component top-level (React hooks rules apply).
 * Use alongside useDeckBuilder for deck editing interfaces.
 *
 * @example
 * ```typescript
 * function DeckEditor({ deckId }: { deckId: Id<"userDecks"> }) {
 *   const deckDetails = useDeck(deckId);
 *
 *   if (!deckDetails) return <Loading />;
 *
 *   return (
 *     <div>
 *       <h2>{deckDetails.name}</h2>
 *       {deckDetails.cards.map(card => <CardView key={card._id} card={card} />)}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param deckId - The deck ID to fetch, or null to skip the query
 *
 * @returns Deck details with full card information, or undefined while loading
 */
export function useDeck(deckId: Id<"userDecks"> | null) {
  const { isAuthenticated } = useAuth();

  // Fetch current user details
  const currentUser = useQuery(typedApi.core.users.currentUser, isAuthenticated ? {} : "skip");

  const userId = currentUser?._id;

  return useQuery(
    (api as any).lunchtable_tcg_cards.decks.getDeckWithCards,
    userId && deckId ? { userId, deckId } : "skip"
  );
}

/**
 * Validates deck composition against game rules.
 *
 * Checks deck size requirements, card quantity limits, and other deck construction
 * rules. Use this to show validation errors in the deck builder UI. This hook must
 * be called at component top-level (React hooks rules apply).
 *
 * @example
 * ```typescript
 * function DeckBuilder({ deckId }: { deckId: Id<"userDecks"> }) {
 *   const validation = useValidateDeck(deckId);
 *
 *   if (!validation) return <Loading />;
 *
 *   return (
 *     <div>
 *       {!validation.isValid && (
 *         <Alert variant="error">
 *           {validation.errors.map(err => <div key={err}>{err}</div>)}
 *         </Alert>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param deckId - The deck ID to validate, or null to skip the query
 *
 * @returns Validation result with isValid boolean and errors array, or undefined while loading
 */
export function useValidateDeck(deckId: Id<"userDecks"> | null) {
  const { isAuthenticated } = useAuth();

  // Fetch current user details
  const currentUser = useQuery(typedApi.core.users.currentUser, isAuthenticated ? {} : "skip");

  const userId = currentUser?._id;

  return useQuery(
    (api as any).lunchtable_tcg_cards.decks.validateDeck,
    userId && deckId ? { userId, deckId } : "skip"
  );
}
