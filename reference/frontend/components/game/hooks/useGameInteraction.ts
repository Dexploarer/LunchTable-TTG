"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { perf } from "@/lib/debug";
import { categorizeEffect, showEffectActivated } from "@/lib/effectToasts";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CardInZone, useGameBoard } from "./useGameBoard";

interface TargetCard {
  cardId: Id<"cardDefinitions">;
  name: string;
  instanceId: string;
  imageUrl?: string;
  attack?: number;
  defense?: number;
  cardType?: string;
  monsterStats?: {
    level: number;
    attack: number;
    defense: number;
  };
}

interface ActivationResult {
  success: boolean;
  error?: string;
  requiresSelection?: boolean;
  availableTargets?: TargetCard[];
  selectionSource?: "deck" | "graveyard" | "banished" | "board" | "hand";
  minSelections?: number;
  maxSelections?: number;
  selectionPrompt?: string;
}

interface ChainLink {
  cardId: Id<"cardDefinitions">;
  cardName?: string;
  playerId: Id<"users">;
  effect: string;
  spellSpeed: number;
  chainLink: number;
}

export function useGameInteraction(
  lobbyId: Id<"gameLobbies">,
  gameBoard: ReturnType<typeof useGameBoard>,
  gameMode: "pvp" | "story" = "pvp"
) {
  const navigate = useNavigate();

  const {
    player,
    opponent,
    playerId,
    isPlayerTurn,
    currentPhase,
    isMainPhase,
    isBattlePhase,
    attackOptions,
    responseWindow,
    chainResponses,
    normalSummon,
    setMonster,
    setSpellTrap,
    activateSpell,
    activateFieldSpell,
    activateTrap,
    activateMonsterEffect,
    respondToChain,
    passResponseWindow,
  } = gameBoard;

  // UI State
  const [selectedHandCard, setSelectedHandCard] = useState<CardInZone | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<CardInZone | null>(null);
  const [selectedBackrowCard, setSelectedBackrowCard] = useState<CardInZone | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardInZone | null>(null);
  const [isInspectedOpponent, setIsInspectedOpponent] = useState(false);

  // Modal State
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showCardInspector, setShowCardInspector] = useState(false);
  const [isForfeitLoading, setIsForfeitLoading] = useState(false);

  // Complex Selection State
  const [cardSelection, setCardSelection] = useState<{
    cards: CardInZone[];
    zone: "deck" | "graveyard" | "banished" | "board" | "hand";
    selectionMode?: "single" | "multi";
    minSelections?: number;
    maxSelections?: number;
    title?: string;
    description?: string;
    callback: (cardIds: Id<"cardDefinitions">[]) => void;
  } | null>(null);

  const [costPayment, setCostPayment] = useState<{
    cardId: Id<"cardDefinitions">;
    cardName: string;
    costType: "discard" | "pay_lp" | "tribute" | "banish";
    costValue: number;
    availableCards: CardInZone[];
    effectIndex?: number;
    callback: (costTargets?: Id<"cardDefinitions">[]) => void;
  } | null>(null);

  // Mutations required for interactions
  const completeSearchEffectMutation = useConvexMutation(
    typedApi.gameplay.gameEngine.spellsTraps.completeSearchEffect
  );

  const getPendingCostMutation = useConvexMutation(
    typedApi.gameplay.effectSystem.costPayment.getPendingCostRequirement
  );

  const completeSearchEffect = useCallback(
    async (args: {
      lobbyId: Id<"gameLobbies">;
      sourceCardId: Id<"cardDefinitions">;
      selectedCardId: Id<"cardDefinitions">;
    }) => {
      return completeSearchEffectMutation(args);
    },
    [completeSearchEffectMutation]
  );

  // Queries shifted from GameBoard
  const pendingOptionalTriggers = useConvexQuery(
    typedApi.gameplay.games.queries.getPendingOptionalTriggers,
    { lobbyId }
  );
  const timeoutStatus = useConvexQuery(typedApi.gameplay.games.queries.getTimeoutStatus, {
    lobbyId,
  });

  // Effect Notifications - Subscribe to auto-triggered effects
  const lastEventTimestamp = useRef<number>(Date.now());
  const gameEventsArgs = lobbyId
    ? {
        lobbyId,
        sinceTimestamp: lastEventTimestamp.current,
        eventTypes: ["effect_activated"],
        limit: 10,
      }
    : "skip";
  const gameEvents = useConvexQuery(
    typedApi.gameplay.gameEvents.subscribeToGameEvents,
    gameEventsArgs
  );

  // Show toast notifications for auto-triggered effects
  useEffect(() => {
    if (!gameEvents || gameEvents.length === 0) return;

    gameEvents.forEach(
      (event: {
        timestamp: number;
        description?: string;
        metadata?: { trigger?: string; cardName?: string };
      }) => {
        // Update last seen timestamp
        if (event.timestamp > lastEventTimestamp.current) {
          lastEventTimestamp.current = event.timestamp;
        }

        // Don't show notifications for manual activations (handled by other toasts)
        if (event.metadata?.trigger === "manual") return;

        const cardName = event.metadata?.cardName as string | undefined;
        const description = event.description || "Effect activated";

        // Distinct toast for AI optional trigger activations
        if (event.metadata?.trigger === "optional_ai") {
          toast.info(`Opponent triggered ${cardName || "a card"}`, {
            description: "Optional effect activated",
            duration: 3000,
          });
          return;
        }

        // Use enhanced toast with categorization
        categorizeEffect(description);
        showEffectActivated(cardName || "Card Effect", description);
      }
    );
  }, [gameEvents]);

  // Track AI chain responses — toast when opponent adds a chain link
  const prevChainLength = useRef(0);
  useEffect(() => {
    const chain = chainResponses?.chain;
    if (!chain || chain.length === 0) {
      prevChainLength.current = 0;
      return;
    }
    if (chain.length > prevChainLength.current) {
      // New chain link(s) added — check if any are from the opponent
      for (let i = prevChainLength.current; i < chain.length; i++) {
        const link = chain[i] as ChainLink | undefined;
        if (link && link.playerId !== playerId) {
          toast.info(`Opponent activated ${link.cardName || "a card"}`, {
            description: `Chain Link ${link.chainLink || i + 1}`,
            duration: 3000,
          });
        }
      }
    }
    prevChainLength.current = chain.length;
  }, [chainResponses?.chain, playerId]);

  // Battle Logic shifted from GameBoard
  const attackableAttackers = useMemo(() => {
    if (!attackOptions) return new Set<Id<"cardDefinitions">>();
    return new Set(
      attackOptions.filter((option) => option.canAttack).map((option) => option.instanceId)
    );
  }, [attackOptions]);

  const selectedAttackOption = useMemo(() => {
    if (!attackOptions || !selectedFieldCard) return null;
    return (
      attackOptions.find((option) => option.instanceId === selectedFieldCard.instanceId) ?? null
    );
  }, [attackOptions, selectedFieldCard]);

  const targetableCards = useMemo(() => {
    if (!isBattlePhase || !selectedAttackOption || !selectedAttackOption.canAttack) {
      return new Set<Id<"cardDefinitions">>();
    }
    return new Set(selectedAttackOption.validTargets);
  }, [isBattlePhase, selectedAttackOption]);

  const attackTargets = useMemo(() => {
    if (!selectedAttackOption || !opponent) return [];
    const opponentField = new Map<Id<"cardDefinitions">, CardInZone>();
    if (opponent.frontline) {
      opponentField.set(opponent.frontline.instanceId, opponent.frontline);
    }
    for (const card of opponent.support) {
      opponentField.set(card.instanceId, card);
    }

    return selectedAttackOption.validTargets.flatMap((targetId) => {
      const card = opponentField.get(targetId);
      if (!card) return [];
      return [
        {
          instanceId: card.instanceId,
          name: card.name,
          attack: card.monsterStats?.attack,
          defense: card.monsterStats?.defense,
          position: card.position ?? (card.isFaceDown ? "setDefense" : "attack"),
          isFaceDown: card.isFaceDown,
        },
      ];
    });
  }, [selectedAttackOption, opponent]);

  const canAttack = useMemo(() => {
    return attackOptions?.some((option) => option.canAttack) ?? false;
  }, [attackOptions]);

  const defaultAttacker = useMemo(() => {
    if (!player || attackableAttackers.size === 0) return null;
    if (player.frontline && attackableAttackers.has(player.frontline.instanceId)) {
      return player.frontline;
    }
    return player.support.find((card) => attackableAttackers.has(card.instanceId)) ?? null;
  }, [player, attackableAttackers]);

  // Chain / Response Memos shifted from GameBoard
  const responseCards = useMemo(() => {
    if (!chainResponses || !chainResponses.chain || !player) return [];

    return chainResponses.chain.map((response) => {
      const card =
        player.backrow.find((c) => c.instanceId === response.cardId) ??
        player.hand.find((c) => c.instanceId === response.cardId);

      return {
        cardId: response.cardId,
        effectName: response.effect,
        effectIndex: 0,
        speed: response.spellSpeed as 1 | 2 | 3,
        card,
      };
    });
  }, [chainResponses, player]);

  const showBattleResponseWindow = useMemo(() => {
    if (!responseWindow) return false;
    const isBattleWindow =
      responseWindow.type === "attack_declaration" || responseWindow.type === "damage_calculation";
    return (
      isBattleWindow && responseWindow.canRespond && responseWindow.activePlayerId === playerId
    );
  }, [responseWindow, playerId]);

  const battleResponseActionType = useMemo(() => {
    if (!responseWindow) return "chain_response";
    if (responseWindow.type === "attack_declaration") return "attack_response";
    if (responseWindow.type === "damage_calculation") return "damage_response";
    return "chain_response";
  }, [responseWindow]);

  const battleResponseCards = useMemo(() => {
    if (!showBattleResponseWindow || !player) return [];
    return player.backrow
      .filter((card) => {
        return card.cardType === "trap" || card.cardType === "spell";
      })
      .map((card) => ({
        cardId: card.instanceId,
        effectName: card.name || "Activate",
        effectIndex: 0,
        speed: 2 as 1 | 2 | 3,
        card,
      }));
  }, [showBattleResponseWindow, player]);

  // Interaction Handlers

  const handleDeclareAttack = useCallback(
    async (targetId?: Id<"cardDefinitions">) => {
      if (!selectedFieldCard) return;

      const result = await gameBoard.declareAttack(selectedFieldCard.instanceId, targetId);

      if (result.success) {
        toast.success(`${selectedFieldCard.name} attacked!`);
        setSelectedFieldCard(null);
        setShowAttackModal(false);
      } else if (result.error) {
        toast.error("Attack Failed", {
          description: result.error,
        });
      }
    },
    [selectedFieldCard, gameBoard.declareAttack]
  );

  const handleHandCardClick = useCallback(
    (card: CardInZone) => {
      if (!isPlayerTurn) {
        toast.warning("Not Your Turn", {
          description: "Wait for your opponent to finish their turn.",
        });
        return;
      }

      if (!isMainPhase) {
        const phaseNames: Record<string, string> = {
          draw: "Draw Phase",
          main: "Main Phase",
          combat: "Combat Phase",
          breakdown_check: "Breakdown Check",
          end: "End Phase",
        };
        const phaseName = phaseNames[currentPhase || ""] || currentPhase || "Unknown Phase";

        toast.warning("Wrong Phase", {
          description: `You can only play cards during the Main Phase. Current Phase: ${phaseName}.`,
        });
        return;
      }

      setSelectedHandCard(card);
      setShowSummonModal(true);
    },
    [isPlayerTurn, isMainPhase, currentPhase]
  );

  const handleMonsterAttackClick = useCallback(
    (card: CardInZone) => {
      if (!isBattlePhase || !isPlayerTurn) return;
      setSelectedFieldCard(card);
      setShowAttackModal(true);
    },
    [isBattlePhase, isPlayerTurn]
  );

  const handleFieldCardClick = useCallback(
    (card: CardInZone) => {
      // Check if this is a battle phase attack
      if (isBattlePhase && isPlayerTurn && attackableAttackers.has(card.instanceId)) {
        setSelectedFieldCard(card);
        setShowAttackModal(true);
        return;
      }

      // Check if this is selecting an attack target
      if (isBattlePhase && selectedFieldCard && targetableCards.has(card.instanceId)) {
        handleDeclareAttack(card.instanceId);
        return;
      }

      // Check if this is your own stereotype with activatable effects
      const isPlayerCard =
        player?.frontline?.instanceId === card.instanceId ||
        player?.support?.some((c) => c.instanceId === card.instanceId);
      const isMonster = card.cardType === "stereotype";
      const hasManualEffects = card.effects?.some(
        (e) => e.activationType === "ignition" || e.activationType === "quick"
      );

      if (isPlayerCard && isMonster && hasManualEffects && !card.isFaceDown && isPlayerTurn) {
        setSelectedFieldCard(card);
        setShowActivateModal(true);
        return;
      }

      // Default: Show card inspector for face-up cards
      if (!card.isFaceDown) {
        setInspectedCard(card);
        const isOpponentCard =
          opponent?.frontline?.instanceId === card.instanceId ||
          opponent?.support?.some((c) => c.instanceId === card.instanceId) ||
          opponent?.backrow?.some((c) => c.instanceId === card.instanceId);
        setIsInspectedOpponent(isOpponentCard ?? false);
        setShowCardInspector(true);
        return;
      }

      setSelectedFieldCard((prev) => (prev?.instanceId === card.instanceId ? null : card));
    },
    [
      isBattlePhase,
      isPlayerTurn,
      player,
      opponent,
      selectedFieldCard,
      handleDeclareAttack,
      attackableAttackers,
      targetableCards,
    ]
  );

  const handleSummon = useCallback(
    async (position: "attack" | "defense", tributeIds?: Id<"cardDefinitions">[]) => {
      if (!selectedHandCard) return;

      const level = selectedHandCard.monsterStats?.level ?? 0;
      const tributesRequired = level >= 7 ? 1 : 0;
      const tributesProvided = tributeIds?.length ?? 0;

      if (tributesRequired > 0 && tributesProvided < tributesRequired) {
        toast.error("Tribute Required", {
          description: `This Level ${level} stereotype requires ${tributesRequired} tribute. Please select ${tributesRequired} stereotype from your field to tribute.`,
        });
        return;
      }

      const result = await perf.time(`normalSummon_${selectedHandCard.name}`, async () =>
        normalSummon(selectedHandCard.instanceId, position, tributeIds)
      );

      if (result.success) {
        toast.success(`${selectedHandCard.name} summoned in ${position} position!`);
        setSelectedHandCard(null);
        setShowSummonModal(false);
      } else if (result.error) {
        toast.error("Summon Failed", {
          description: result.error,
        });
      }
    },
    [selectedHandCard, normalSummon]
  );

  const handleSetMonster = useCallback(async () => {
    if (!selectedHandCard) return;

    const result = await setMonster(selectedHandCard.instanceId);

    if (result.success) {
      toast.success(`${selectedHandCard.name} set face-down in defense position!`);
      setSelectedHandCard(null);
      setShowSummonModal(false);
    } else if (result.error) {
      toast.error("Set Stereotype Failed", {
        description: result.error,
      });
    }
  }, [selectedHandCard, setMonster]);

  const handleSetSpellTrap = useCallback(async () => {
    if (!selectedHandCard) return;

    const result = await setSpellTrap(selectedHandCard.instanceId);

    if (result.success) {
      toast.success(`${selectedHandCard.name} set face-down in spell/trap zone!`);
      setSelectedHandCard(null);
      setShowSummonModal(false);
    } else if (result.error) {
      toast.error("Set Spell/Trap Failed", {
        description: result.error,
      });
    }
  }, [selectedHandCard, setSpellTrap]);

  const handleHandCardActivate = useCallback(async () => {
    if (!selectedHandCard) return;

    let result: ActivationResult;
    if (selectedHandCard.cardType === "field") {
      result = await activateFieldSpell(selectedHandCard.instanceId);
    } else {
      result = await activateSpell(selectedHandCard.instanceId);
    }

    if (result?.success && result.requiresSelection && Array.isArray(result.availableTargets)) {
      setCardSelection({
        cards: result.availableTargets.map((target) => ({
          cardId: target.cardId,
          name: target.name,
          cardType: target.cardType,
          imageUrl: target.imageUrl,
          monsterStats: target.monsterStats,
          instanceId: target.cardId,
        })),
        zone: result.selectionSource || "deck",
        selectionMode: (result.maxSelections || 1) > 1 ? "multi" : "single",
        minSelections: result.minSelections || 1,
        maxSelections: result.maxSelections || 1,
        title: result.selectionPrompt?.split(":")[0] || "Select Cards",
        description: result.selectionPrompt || "Select a card",
        callback: async (selectedIds) => {
          const selectedCardId = selectedIds[0];
          if (!selectedCardId) {
            toast.error("No card selected");
            return;
          }
          try {
            await completeSearchEffect({
              lobbyId,
              sourceCardId: selectedHandCard.cardId,
              selectedCardId,
            });
            toast.success("Card added to hand!");
            setSelectedHandCard(null);
            setShowSummonModal(false);
          } catch (_error) {
            toast.error("Failed to complete search");
          }
        },
      });
    } else if (result?.success) {
      toast.success(`${selectedHandCard.name} activated!`);
      setSelectedHandCard(null);
      setShowSummonModal(false);
    } else if (result?.error) {
      toast.error("Activation Failed", {
        description: result.error,
      });
    }
  }, [selectedHandCard, activateSpell, activateFieldSpell, lobbyId, completeSearchEffect]);

  const handleAdvancePhase = useCallback(async () => {
    const result = await gameBoard.advancePhase();
    if (!result.success && result.error) {
      toast.error("Phase Advance Failed", {
        description: result.error,
      });
    }
  }, [gameBoard.advancePhase]);

  const handleEndTurn = useCallback(async () => {
    const result = await gameBoard.endTurn();
    if (!result.success && result.error) {
      toast.error("End Turn Failed", {
        description: result.error,
      });
    }
  }, [gameBoard.endTurn]);

  const handleForfeit = useCallback(async () => {
    setIsForfeitLoading(true);
    try {
      const result = await gameBoard.forfeitGame();
      if (result.success) {
        toast.info("Game forfeited");

        if (gameMode === "story") {
          navigate({ to: "/play/story" });
        } else {
          navigate({ to: "/lunchtable" });
        }
      } else if (result.error) {
        toast.error("Forfeit Failed", {
          description: result.error,
        });
      }
    } finally {
      setIsForfeitLoading(false);
      setShowForfeitDialog(false);
    }
  }, [gameBoard.forfeitGame, gameMode, navigate]);

  const handleBackrowCardClick = useCallback((card: CardInZone) => {
    setSelectedBackrowCard(card);
    setShowActivateModal(true);
  }, []);

  const handleActivateCard = useCallback(
    async (effectIndex?: number, costTargets?: Id<"cardDefinitions">[]) => {
      const selectedCard = selectedBackrowCard || selectedFieldCard;
      if (!selectedCard) return;

      const isField = selectedCard.cardType === "field";
      const isSpell = selectedCard.cardType === "spell" || selectedCard.cardType === "class";
      const isTrap = selectedCard.cardType === "trap";
      const isMonster = selectedCard.cardType === "stereotype";

      try {
        const costCheck = await getPendingCostMutation({
          lobbyId,
          cardId: selectedCard.cardId,
          effectIndex,
        });

        if (costCheck.hasCost && costCheck.canPay && costCheck.requiresSelection && !costTargets) {
          setCostPayment({
            cardId: selectedCard.cardId,
            cardName: costCheck.cardName || selectedCard.name || "Card",
            costType: costCheck.costType as "discard" | "pay_lp" | "tribute" | "banish",
            costValue: costCheck.costValue || 1,
            availableCards: ((costCheck.availableTargets || []) as TargetCard[]).map((target) => ({
              cardId: target.cardId,
              name: target.name,
              cardType: target.cardType,
              imageUrl: target.imageUrl,
              monsterStats: target.monsterStats,
              instanceId: target.cardId,
            })),
            effectIndex,
            callback: async (selectedCostTargets) => {
              await handleActivateCard(effectIndex, selectedCostTargets);
              setCostPayment(null);
            },
          });
          return;
        }
      } catch (error) {
        console.error("Cost check error:", error);
      }

      let result: ActivationResult | undefined;
      if (isField) {
        result = await activateFieldSpell(selectedCard.instanceId, effectIndex);
      } else if (isSpell) {
        result = await activateSpell(selectedCard.instanceId, effectIndex);
      } else if (isTrap) {
        result = await activateTrap(selectedCard.instanceId, effectIndex);
      } else if (isMonster) {
        result = (await activateMonsterEffect(
          selectedCard.instanceId,
          effectIndex,
          costTargets
        )) as ActivationResult;
      } else {
        return;
      }

      if (result?.success && result.requiresSelection && Array.isArray(result.availableTargets)) {
        setCardSelection({
          cards: result.availableTargets.map((target) => ({
            cardId: target.cardId,
            name: target.name,
            cardType: target.cardType,
            imageUrl: target.imageUrl,
            monsterStats: target.monsterStats,
            instanceId: target.cardId,
          })),
          zone: result.selectionSource || "deck",
          selectionMode: (result.maxSelections || 1) > 1 ? "multi" : "single",
          minSelections: result.minSelections || 1,
          maxSelections: result.maxSelections || 1,
          title: result.selectionPrompt?.split(":")[0] || "Select Cards",
          description: result.selectionPrompt || "Select a card",
          callback: async (selectedIds) => {
            const selectedCardId = selectedIds[0];
            if (!selectedCardId) {
              toast.error("No card selected");
              return;
            }
            try {
              await completeSearchEffect({
                lobbyId,
                sourceCardId: selectedCard.cardId,
                selectedCardId,
              });
              toast.success("Card added to hand!");
              setSelectedBackrowCard(null);
              setShowActivateModal(false);
            } catch (_error) {
              toast.error("Failed to complete effect");
            }
          },
        });
      } else if (result?.success) {
        toast.success(`${selectedCard.name} activated!`);
        setSelectedBackrowCard(null);
        setSelectedFieldCard(null);
        setShowActivateModal(false);
      } else if (result?.error) {
        toast.error("Activation Failed", {
          description: result.error,
        });
      }
    },
    [
      selectedBackrowCard,
      selectedFieldCard,
      activateFieldSpell,
      activateSpell,
      activateTrap,
      activateMonsterEffect,
      lobbyId,
      completeSearchEffect,
      getPendingCostMutation,
    ]
  );

  const handleChainResponse = useCallback(
    async (cardInstanceId: Id<"cardDefinitions">, effectIndex: number) => {
      await respondToChain({
        cardId: cardInstanceId,
        effectIndex,
      });
    },
    [respondToChain]
  );

  const handlePassChain = useCallback(async () => {
    await respondToChain("pass");
  }, [respondToChain]);

  const handlePassResponseWindow = useCallback(async () => {
    await passResponseWindow();
  }, [passResponseWindow]);

  return {
    // UI State
    selectedHandCard,
    setSelectedHandCard,
    selectedFieldCard,
    setSelectedFieldCard,
    selectedBackrowCard,
    setSelectedBackrowCard,
    inspectedCard,
    setInspectedCard,
    isInspectedOpponent,
    setIsInspectedOpponent,
    showSummonModal,
    setShowSummonModal,
    showAttackModal,
    setShowAttackModal,
    showForfeitDialog,
    setShowForfeitDialog,
    showActivateModal,
    setShowActivateModal,
    showCardInspector,
    setShowCardInspector,
    isForfeitLoading,
    cardSelection,
    setCardSelection,
    costPayment,
    setCostPayment,

    // Memos / Data
    attackableAttackers,
    selectedAttackOption,
    targetableCards,
    attackTargets,
    canAttack,
    defaultAttacker,
    responseCards,
    showBattleResponseWindow,
    battleResponseActionType,
    battleResponseCards,
    pendingOptionalTriggers,
    timeoutStatus,

    // Handlers
    handleHandCardClick,
    handleMonsterAttackClick,
    handleFieldCardClick,
    handleSummon,
    handleSetMonster,
    handleSetSpellTrap,
    handleHandCardActivate,
    handleAdvancePhase,
    handleEndTurn,
    handleForfeit,
    handleBackrowCardClick,
    handleActivateCard,
    handleDeclareAttack,
    handleChainResponse,
    handlePassChain,
    handlePassResponseWindow,
  };
}
