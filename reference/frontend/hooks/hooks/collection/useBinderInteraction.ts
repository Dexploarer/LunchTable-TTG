"use client";

import { useCardCollection } from "./useCardCollection";
import { useDeckEditor } from "./useDeckEditor";

export function useBinderInteraction() {
  const collection = useCardCollection();
  const deckEditor = useDeckEditor();

  // Combine functionality for the Binder page
  return {
    ...collection,
    ...deckEditor,
    // Note: Some fields might overlap (like decks, isLoading),
    // but they come from the same base hooks so it's consistent.

    // Explicitly override any conflicting methods if necessary
    handleCreateDeck: deckEditor.handleCreateDeck,
    handleSaveDeck: deckEditor.handleSaveDeck,
    handleRenameDeck: deckEditor.handleRenameDeck,
    handleSetActiveDeck: deckEditor.setActiveDeck,
  };
}
