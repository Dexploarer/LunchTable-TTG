"use client";

import type { CardData, DeckCard } from "@/types/binder";
import { DECK_MIN_SIZE, MAX_COPIES_PER_CARD, MAX_LEGENDARY_COPIES } from "@/types/binder";
import type { CardType, Element, Rarity } from "@/types/cards";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDeck, useDeckBuilder } from "./useDeckBuilder";

export function useDeckEditor() {
  const deckBuilder = useDeckBuilder();

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [currentDeckCards, setCurrentDeckCards] = useState<DeckCard[]>([]);
  const [isEditingDeckName, setIsEditingDeckName] = useState(false);
  const [editingDeckName, setEditingDeckName] = useState("");
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  // Confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [clearDeckConfirmOpen, setClearDeckConfirmOpen] = useState(false);

  const selectedDeckData = useDeck(selectedDeckId as Id<"userDecks"> | null);

  // Get selected deck basic info
  const selectedDeck = deckBuilder.decks?.find((d) => d.id === selectedDeckId) || null;

  // Sync currentDeckCards when selectedDeckData changes
  useEffect(() => {
    if (selectedDeckData?.cards) {
      const loadedCards: DeckCard[] = selectedDeckData.cards.map((apiCard) => ({
        card: {
          id: apiCard.cardDefinitionId,
          cardDefinitionId: apiCard.cardDefinitionId,
          name: apiCard.name,
          rarity: apiCard.rarity as Rarity,
          element: apiCard.element as Element,
          cardType: apiCard.cardType as CardType,
          attack: apiCard.attack,
          defense: apiCard.defense,
          cost: apiCard.cost,
          ability: apiCard.ability,
          flavorText: apiCard.flavorText,
          imageUrl: apiCard.imageUrl,
          owned: 0, // Not needed for deck cards usually
          isFavorite: false,
        },
        count: apiCard.quantity,
      }));
      setCurrentDeckCards(loadedCards);
    }
  }, [selectedDeckData]);

  const getCardCountInDeck = (cardId: string) => {
    return currentDeckCards.find((dc) => dc.card.id === cardId)?.count || 0;
  };

  const canAddCardToDeck = (card: CardData) => {
    const currentCount = getCardCountInDeck(card.id);
    const maxCopies = card.rarity === "legendary" ? MAX_LEGENDARY_COPIES : MAX_COPIES_PER_CARD;
    return currentCount < maxCopies && currentCount < card.owned;
  };

  const addCardToDeck = (card: CardData) => {
    if (!canAddCardToDeck(card)) return;
    setCurrentDeckCards((prev) => {
      const existing = prev.find((dc) => dc.card.id === card.id);
      if (existing) {
        return prev.map((dc) => (dc.card.id === card.id ? { ...dc, count: dc.count + 1 } : dc));
      }
      return [...prev, { card, count: 1 }];
    });
  };

  const removeCardFromDeck = (cardId: string) => {
    setCurrentDeckCards((prev) => {
      const existing = prev.find((dc) => dc.card.id === cardId);
      if (!existing) return prev;
      if (existing.count === 1) {
        return prev.filter((dc) => dc.card.id !== cardId);
      }
      return prev.map((dc) => (dc.card.id === cardId ? { ...dc, count: dc.count - 1 } : dc));
    });
  };

  const handleCreateDeck = async (name: string) => {
    try {
      const deckId = await deckBuilder.createDeck(name);
      setSelectedDeckId(deckId as string);
      setCurrentDeckCards([]);
    } catch (error) {
      console.error("Failed to create deck:", error);
    }
  };

  const handleSaveDeck = async () => {
    if (!selectedDeckId) return;
    const totalCards = currentDeckCards.reduce((sum, dc) => sum + dc.count, 0);
    if (totalCards < DECK_MIN_SIZE) {
      toast.error(`Deck must have at least ${DECK_MIN_SIZE} cards. Currently has ${totalCards}.`);
      return;
    }

    setIsSavingDeck(true);
    try {
      const cardsToSave = currentDeckCards.map((dc) => ({
        cardDefinitionId: (dc.card.cardDefinitionId || dc.card.id) as Id<"cardDefinitions">,
        quantity: dc.count,
      }));
      await deckBuilder.saveDeck(selectedDeckId as Id<"userDecks">, cardsToSave);
    } catch (error) {
      console.error("Failed to save deck:", error);
    } finally {
      setIsSavingDeck(false);
    }
  };

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    try {
      await deckBuilder.deleteDeck(deckToDelete as Id<"userDecks">);
      if (selectedDeckId === deckToDelete) {
        setSelectedDeckId(null);
        setCurrentDeckCards([]);
      }
    } catch (error) {
      console.error("Failed to delete deck:", error);
    } finally {
      setDeleteConfirmOpen(false);
      setDeckToDelete(null);
    }
  };

  const handleRenameDeck = async () => {
    if (!selectedDeckId || !editingDeckName.trim()) return;
    try {
      await deckBuilder.renameDeck(selectedDeckId as Id<"userDecks">, editingDeckName.trim());
      setIsEditingDeckName(false);
    } catch (error) {
      console.error("Failed to rename deck:", error);
    }
  };

  const clearDeck = () => {
    setCurrentDeckCards([]);
    setClearDeckConfirmOpen(false);
    toast.success("Deck cleared");
  };

  return {
    ...deckBuilder,
    selectedDeckId,
    setSelectedDeckId,
    currentDeckCards,
    setCurrentDeckCards,
    isEditingDeckName,
    setIsEditingDeckName,
    editingDeckName,
    setEditingDeckName,
    isSavingDeck,
    selectedDeck,

    // Dialog state
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deckToDelete,
    setDeckToDelete,
    clearDeckConfirmOpen,
    setClearDeckConfirmOpen,

    // Handlers
    getCardCountInDeck,
    canAddCardToDeck,
    addCardToDeck,
    removeCardFromDeck,
    handleCreateDeck,
    handleSaveDeck,
    confirmDeleteDeck,
    handleRenameDeck,
    clearDeck,
  };
}
