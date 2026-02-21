"use client";

import { type JsonAbility, getCardEffectsArray } from "@/lib/cardHelpers";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { useCallback, useMemo } from "react";

// =============================================================================
// Query Return Types (simplified to avoid deep type instantiation)
// =============================================================================

interface CurrentUser {
  _id: Id<"users">;
  _creationTime: number;
  username?: string;
  name?: string;
  email?: string;
  bio?: string;
  level?: number;
  xp?: number;
  gold?: number;
}

interface LobbyDetails {
  _id: Id<"gameLobbies">;
  _creationTime: number;
  hostId: Id<"users">;
  hostUsername: string;
  hostRank: string;
  hostRating: number;
  mode: string;
  status: string;
  isPrivate: boolean;
  opponentId?: Id<"users">;
  opponentUsername?: string;
  gameId?: string;
  winnerId?: Id<"users">;
  createdAt: number;
}

interface GameStateCard {
  _id: Id<"cardDefinitions">;
  _creationTime: number;
  name: string;
  cardType: string;
  rarity: string;
  archetype: string;
  imageUrl?: string;
  attack?: number;
  defense?: number;
  cost?: number;
  ability?: JsonAbility;
  effectType?: string;
}

interface GameStateBoardCard extends GameStateCard {
  currentAttack: number;
  currentDefense: number;
  position: number;
  hasAttacked: boolean;
  isFaceDown: boolean;
}

interface GameStateBackrowCard extends GameStateCard {
  isFaceDown: boolean;
  isActivated: boolean;
}

interface GameStateFieldSpell extends GameStateCard {
  isActive: boolean;
}

interface GameState {
  gameId: string;
  lobbyId: Id<"gameLobbies">;
  isHost: boolean;
  playerId: Id<"users">;
  opponentId: Id<"users">;
  opponentUsername: string;
  currentTurnPlayerId: Id<"users">;
  turnNumber: number;
  isYourTurn: boolean;
  currentPhase: string;
  currentChain: Array<{
    cardId: Id<"cardDefinitions">;
    effect: string;
    spellSpeed: number;
    playerId: Id<"users">;
  }>;
  currentPriorityPlayer?: Id<"users">;
  pendingAction?: {
    type: string;
    data: Record<string, unknown>;
  };
  myNormalSummonedThisTurn: boolean;
  myHand: GameStateCard[];
  myBoard: GameStateBoardCard[];
  mySpellTrapZone: GameStateBackrowCard[];
  myFieldSpell: GameStateFieldSpell | null;
  myDeckCount: number;
  myGraveyard: GameStateCard[];
  myLifePoints: number;
  myClout: number;
  opponentHandCount: number;
  opponentBoard: GameStateBoardCard[];
  opponentSpellTrapZone: GameStateBackrowCard[];
  opponentFieldSpell: GameStateFieldSpell | null;
  opponentDeckCount: number;
  opponentGraveyard: GameStateCard[];
  opponentLifePoints: number;
  opponentClout: number;
  mode: string;
  lastMoveAt: number;
  responseWindow?: {
    type: string;
    triggerPlayerId: Id<"users">;
    activePlayerId: Id<"users">;
    canRespond: boolean;
    chainOpen: boolean;
    passCount: number;
    createdAt: number;
    expiresAt?: number;
  };
}

interface AvailableActions {
  actions: string[];
  summonableCards?: Id<"cardDefinitions">[];
  settableCards?: Id<"cardDefinitions">[];
  activatableCards?: Id<"cardDefinitions">[];
  attackableCards?: Id<"cardDefinitions">[];
}

interface ChainState {
  chain: Array<{
    cardId: Id<"cardDefinitions">;
    effect: string;
    spellSpeed: number;
    playerId: Id<"users">;
  }>;
  priorityPlayer: Id<"users">;
  isResolving: boolean;
}

// =============================================================================
// Types adapted to match actual schema
// =============================================================================

export interface CardInZone {
  instanceId: Id<"cardDefinitions">; // Using cardDefinitionId as instanceId for now
  cardId: Id<"cardDefinitions">;
  name?: string;
  cardType?: string;
  rarity?: string;
  imageUrl?: string;
  archetype?: string;
  attack?: number;
  defense?: number;
  position?: string | number; // "attack" | "defense" | "setDefense" or 1/-1
  isFaceDown?: boolean;
  hasAttacked?: boolean;
  attackModifier?: number;
  defenseModifier?: number;
  // Protection flags
  cannotBeDestroyedByBattle?: boolean;
  cannotBeDestroyedByEffects?: boolean;
  cannotBeTargeted?: boolean;
  monsterStats?: {
    level: number;
    attack?: number;
    defense?: number;
  };
  effects?: Array<{
    name: string;
    description: string;
    effectType?: string;
    trigger?: string;
    activationType?: "trigger" | "ignition" | "quick" | "continuous";
    cost?: {
      type: string;
      value?: number;
      description: string;
    };
    isOPT?: boolean;
    isHOPT?: boolean;
    spellSpeed?: 1 | 2 | 3;
    isContinuous?: boolean;
  }>;
}

export interface PlayerBoard {
  playerId: Id<"users">;
  playerName: string;
  playerType?: string;
  isActivePlayer: boolean;
  lifePoints: number;
  maxLifePoints: number;
  hand: CardInZone[];
  handCount: number;
  frontline: CardInZone | null;
  support: CardInZone[];
  backrow: CardInZone[];
  fieldSpell: CardInZone | null;
  graveyard: CardInZone[];
  graveyardCount: number;
  deckCount: number;
  normalSummonsRemaining: number;
}

export interface GamePhase {
  turnNumber: number;
  activePlayerId: Id<"users">;
  currentPhase: string;
  battleSubPhase?: string;
  attackingCardId?: Id<"cardDefinitions">;
}

export interface ValidActions {
  isYourTurn: boolean;
  currentPhase?: string;
  canNormalSummon: boolean;
  canSetMonster: boolean;
  canSetSpellTrap: boolean;
  canActivateSpell: boolean;
  canActivateTrap: boolean;
  canAttack: boolean;
  canAdvancePhase: boolean;
  canEndTurn: boolean;
  summonableMonsters?: Id<"cardDefinitions">[];
  settableMonsters?: Id<"cardDefinitions">[];
  settableSpellTraps?: Id<"cardDefinitions">[];
  activatableSpells?: Id<"cardDefinitions">[];
  activatableFieldCards?: Id<"cardDefinitions">[];
  activatableTraps?: Id<"cardDefinitions">[];
  attackers?: Id<"cardDefinitions">[];
}

export interface AttackOption {
  instanceId: Id<"cardDefinitions">;
  name?: string;
  attack?: number;
  position?: string;
  canAttack: boolean;
  canDirectAttack: boolean;
  validTargets: Id<"cardDefinitions">[];
}

export interface AttackTarget {
  instanceId: Id<"cardDefinitions">;
  name?: string;
  attack?: number;
  defense?: number;
  position?: string | number;
  isFaceDown?: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Comprehensive game board state management hook for LunchTable card battles.
 *
 * This is the most complex hook in the application, managing all real-time game state,
 * player actions, and board interactions. It provides optimistic updates for smooth UX
 * and handles the complete game flow from summons to attacks to spell/trap chains.
 *
 * Features:
 * - Real-time game state synchronization via Convex queries
 * - Optimistic UI updates for instant feedback
 * - Complete action system (summon, set, activate, attack, advance phase)
 * - Chain resolution system for spell/trap responses
 * - Automatic AI turn execution for story mode
 * - Board state transformation to match UI requirements
 * - Attack validation and target selection
 * - Phase management and turn flow control
 *
 * @example
 * ```typescript
 * const {
 *   player,
 *   opponent,
 *   phase,
 *   validActions,
 *   isPlayerTurn,
 *   normalSummon,
 *   declareAttack,
 *   endTurn
 * } = useGameBoard(lobbyId, currentPlayerId);
 *
 * // Check if player can summon
 * if (validActions?.canNormalSummon) {
 *   await normalSummon(cardId, "attack");
 * }
 *
 * // Declare an attack
 * if (isPlayerTurn && phase?.currentPhase === "combat") {
 *   await declareAttack(attackerCardId, targetCardId);
 * }
 *
 * // End turn
 * await endTurn();
 * ```
 *
 * @param lobbyId - The game lobby identifier
 * @param currentPlayerId - The current player's user ID
 *
 * @returns {UseGameBoardReturn} Complete game board interface containing:
 * - `player` - Player board state with cards, LP, deck count
 * - `opponent` - Opponent board state (hidden hand)
 * - `phase` - Current phase and turn information
 * - `validActions` - Available actions based on game state
 * - `attackOptions` - Valid attack targets and options
 * - `pendingAction` - Any pending response or selection
 * - `chainResponses` - Chain system state for spell/trap chains
 * - `isLoading` - Loading state indicator
 * - `isPlayerTurn` - Boolean indicating if it's the player's turn
 * - `currentPhase` - Current game phase (draw, main, combat, etc.)
 * - `isMainPhase` - Boolean for main phase check
 * - `isBattlePhase` - Boolean for battle phase check
 * - `gameEnded` - Boolean indicating if game has ended
 * - `winner` - "player" | "opponent" | null
 * - `playableHandCards` - Set of playable card IDs from hand
 * - `activatableBackrowCards` - Set of activatable backrow card IDs
 * - `normalSummon()` - Normal summon a stereotype with optional tributes
 * - `setMonster()` - Set a stereotype face-down
 * - `setSpellTrap()` - Set a spell/trap face-down
 * - `advancePhase()` - Move to next phase
 * - `endTurn()` - End current turn
 * - `declareAttack()` - Declare an attack with target
 * - `forfeitGame()` - Surrender the game
 * - `activateSpell()` - Activate a spell card
 * - `activateFieldSpell()` - Activate a field spell
 * - `activateTrap()` - Activate a trap card
 * - `respondToChain()` - Respond to chain with pass or card activation
 *
 * @throws Will not throw directly but actions return `{ success: boolean, error?: string }`
 */
export function useGameBoard(lobbyId: Id<"gameLobbies">, currentPlayerId: Id<"users">) {
  // ==========================================================================
  // Queries - using actual APIs that exist
  // ==========================================================================

  // First, get lobby details to check if game is active
  const lobbyDetails = useConvexQuery(typedApi.gameplay.games.queries.getLobbyDetails, {
    lobbyId,
  }) as LobbyDetails | undefined;

  // Only query game state if lobby is active (not "waiting")
  // Skip the query if status is completed, forfeited, or cancelled to avoid errors
  const shouldQueryGameState =
    lobbyDetails?.status === "active" || lobbyDetails?.status === "waiting";

  const gameState = useConvexQuery(
    typedApi.gameplay.games.queries.getGameStateForPlayer,
    shouldQueryGameState ? { lobbyId } : "skip"
  ) as GameState | undefined | null;

  const availableActions = useConvexQuery(
    typedApi.gameplay.games.queries.getAvailableActions,
    lobbyDetails?.status === "active" ? { lobbyId } : "skip"
  ) as AvailableActions | undefined;

  // Chain system query
  const chainState = useConvexQuery(
    typedApi.gameplay.chainResolver.getCurrentChain,
    lobbyDetails?.status === "active" ? { lobbyId } : "skip"
  ) as ChainState | undefined | null;

  // Current user query for player name
  const currentUser = useConvexQuery(typedApi.core.users.currentUser, {}) as
    | CurrentUser
    | undefined
    | null;

  // ==========================================================================
  // Mutations - using actual game engine APIs
  // ==========================================================================

  // Mutations using convexHelpers to avoid TS2589
  const normalSummonMutation = useConvexMutation(typedApi.gameplay.gameEngine.summons.normalSummon);
  const setMonsterMutation = useConvexMutation(typedApi.gameplay.gameEngine.summons.setMonster);
  const setSpellTrapMutation = useConvexMutation(
    typedApi.gameplay.gameEngine.spellsTraps.setSpellTrap
  );
  const activateSpellMutation = useConvexMutation(
    typedApi.gameplay.gameEngine.spellsTraps.activateSpell
  );
  const activateTrapMutation = useConvexMutation(
    typedApi.gameplay.gameEngine.spellsTraps.activateTrap
  );
  const activateMonsterEffectMutation = useConvexMutation(
    typedApi.gameplay.gameEngine.monsterEffects.activateMonsterEffect
  );

  // Chain system mutations
  const passPriorityMutation = useConvexMutation(typedApi.gameplay.chainResolver.passPriority);
  const advancePhaseMutation = useConvexMutation(typedApi.gameplay.phaseManager.advancePhase);
  const endTurnMutation = useConvexMutation(typedApi.gameplay.gameEngine.turns.endTurn);
  const surrenderGameMutation = useConvexMutation(typedApi.gameplay.games.lifecycle.surrenderGame);
  const declareAttackMutation = useConvexMutation(
    typedApi.gameplay.combatSystem.declareAttackWithResponse
  );
  const passResponseWindowMutation = useConvexMutation(
    typedApi.gameplay.combatSystem.passResponseWindowPriority
  );

  // ==========================================================================
  // Actions
  // ==========================================================================

  const normalSummon = useCallback(
    async (
      cardId: Id<"cardDefinitions">,
      position: "attack" | "defense",
      tributeIds?: Id<"cardDefinitions">[]
    ) => {
      try {
        await normalSummonMutation({
          lobbyId,
          cardId,
          position,
          tributeCardIds: tributeIds,
        });
        return { success: true };
      } catch (error) {
        console.error("Normal summon failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [normalSummonMutation, lobbyId]
  );

  const setMonster = useCallback(
    async (cardId: Id<"cardDefinitions">) => {
      try {
        await setMonsterMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Set stereotype failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setMonsterMutation, lobbyId]
  );

  const setSpellTrap = useCallback(
    async (cardId: Id<"cardDefinitions">) => {
      try {
        await setSpellTrapMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Set spell/trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setSpellTrapMutation, lobbyId]
  );

  const advancePhase = useCallback(async () => {
    try {
      await advancePhaseMutation({ lobbyId });
      return { success: true };
    } catch (error) {
      console.error("Advance phase failed:", error);
      return { success: false, error: String(error) };
    }
  }, [advancePhaseMutation, lobbyId]);

  const executeAITurnMutation = useConvexMutation(typedApi.gameplay.ai.aiTurn.executeAITurn);

  const endTurn = useCallback(async () => {
    try {
      await endTurnMutation({ lobbyId });

      // Check if this is a story mode game and trigger AI turn
      if (lobbyDetails?.mode === "story") {
        // Give a brief delay for UI to update
        setTimeout(async () => {
          try {
            // Find the game ID from lobby details
            const gameId = lobbyDetails.gameId;
            if (gameId) {
              await executeAITurnMutation({ gameId });
            }
          } catch (aiError) {
            console.error("AI turn execution failed:", aiError);
          }
        }, 1000);
      }

      return { success: true };
    } catch (error) {
      console.error("End turn failed:", error);
      return { success: false, error: String(error) };
    }
  }, [endTurnMutation, lobbyId, lobbyDetails, executeAITurnMutation]);

  const declareAttack = useCallback(
    async (attackingCardId: Id<"cardDefinitions">, targetCardId?: Id<"cardDefinitions">) => {
      try {
        await declareAttackMutation({
          lobbyId,
          attackerCardId: attackingCardId,
          targetCardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Declare attack failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [declareAttackMutation, lobbyId]
  );

  const forfeitGame = useCallback(async () => {
    try {
      await surrenderGameMutation({ lobbyId });
      return { success: true };
    } catch (error) {
      console.error("Forfeit failed:", error);
      return { success: false, error: String(error) };
    }
  }, [surrenderGameMutation, lobbyId]);

  const activateSpell = useCallback(
    async (cardId: Id<"cardDefinitions">, _effectIndex?: number) => {
      try {
        await activateSpellMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateSpellMutation, lobbyId]
  );

  const activateFieldSpell = useCallback(
    async (cardId: Id<"cardDefinitions">, _effectIndex?: number) => {
      try {
        // Field spells use the same activateSpell mutation
        await activateSpellMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate field spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateSpellMutation, lobbyId]
  );

  const activateTrap = useCallback(
    async (cardId: Id<"cardDefinitions">, _effectIndex?: number) => {
      try {
        await activateTrapMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateTrapMutation, lobbyId]
  );

  const activateMonsterEffect = useCallback(
    async (
      cardId: Id<"cardDefinitions">,
      effectIndex?: number,
      targets?: Id<"cardDefinitions">[]
    ) => {
      try {
        await activateMonsterEffectMutation({
          lobbyId,
          cardId,
          effectIndex,
          targets,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate stereotype effect failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateMonsterEffectMutation, lobbyId]
  );

  const passResponseWindow = useCallback(async () => {
    try {
      await passResponseWindowMutation({ lobbyId });
      return { success: true };
    } catch (error) {
      console.error("Pass response window failed:", error);
      return { success: false, error: String(error) };
    }
  }, [passResponseWindowMutation, lobbyId]);

  const respondToChain = useCallback(
    async (response: "pass" | { cardId: Id<"cardDefinitions">; effectIndex: number }) => {
      try {
        if (response === "pass") {
          // Pass priority - if both players pass, chain resolves
          const result = await passPriorityMutation({ lobbyId });
          return {
            success: true,
            chainResolving: result.chainResolved || false,
          };
        }
        // Activate a card in response (trap or quick-play spell)
        const cardId = response.cardId;

        // Try to activate as trap first
        try {
          await activateTrapMutation({ lobbyId, cardId });
          return { success: true, chainResolving: false };
        } catch {
          // If not a trap, try as spell
          await activateSpellMutation({ lobbyId, cardId });
          return { success: true, chainResolving: false };
        }
      } catch (error) {
        console.error("Chain response failed:", error);
        return { success: false, chainResolving: false, error: String(error) };
      }
    },
    [passPriorityMutation, activateTrapMutation, activateSpellMutation, lobbyId]
  );

  // ==========================================================================
  // Computed Values - adapted to actual gameState structure
  // ==========================================================================

  const isPlayerTurn = useMemo(() => {
    return gameState?.isYourTurn ?? false;
  }, [gameState?.isYourTurn]);

  const currentPhase = useMemo(() => {
    return gameState?.currentPhase ?? "unknown";
  }, [gameState?.currentPhase]);

  const isMainPhase = useMemo(() => {
    return currentPhase === "main";
  }, [currentPhase]);

  const isBattlePhase = useMemo(() => {
    return currentPhase === "combat";
  }, [currentPhase]);

  // Loading logic: waiting for lobbyDetails, or if active, waiting for game state
  const isLoading =
    lobbyDetails === undefined ||
    (lobbyDetails.status === "active" &&
      (gameState === undefined || availableActions === undefined));

  const gameEnded = useMemo(() => {
    // Game ends when:
    // 1. Game state becomes null (after forfeit/completion)
    // 2. Lobby status is no longer "active"
    if (gameState === null) return true;
    if (lobbyDetails && lobbyDetails.status !== "active") return true;
    return false;
  }, [gameState, lobbyDetails]);

  const winner = useMemo(() => {
    // Determine winner from lobby details
    if (!lobbyDetails || !lobbyDetails.winnerId) return null;

    // Return "player" if current player won, "opponent" if they lost
    return lobbyDetails.winnerId === currentPlayerId ? "player" : "opponent";
  }, [lobbyDetails, currentPlayerId]);

  // Transform gameState data to match PlayerBoard interface
  const player = useMemo<PlayerBoard | null>(() => {
    if (!gameState) return null;

    return {
      playerId: currentPlayerId,
      playerName: currentUser?.username || currentUser?.name || "You",
      playerType: "human",
      isActivePlayer: gameState.isYourTurn,
      lifePoints: gameState.myLifePoints,
      maxLifePoints: 8000,
      hand: gameState.myHand.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        monsterStats:
          card.cardType === "stereotype"
            ? {
                attack: card.attack,
                defense: card.defense,
                level: card.cost || 0, // cost represents the stereotype level/tribute requirement
              }
            : undefined,
        effects: getCardEffectsArray(card.ability),
        isFaceDown: false,
      })),
      handCount: gameState.myHand.length,
      frontline: null, // All stereotypes use support zones
      support: gameState.myBoard.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        attack: card.currentAttack,
        defense: card.currentDefense,
        position: card.position === 1 ? "attack" : "defense",
        hasAttacked: card.hasAttacked,
        isFaceDown: card.isFaceDown,
        monsterStats: {
          attack: card.currentAttack,
          defense: card.currentDefense,
          level: card.cost || 0, // cost represents the stereotype level/tribute requirement
        },
        effects: getCardEffectsArray(card.ability),
      })),
      backrow: gameState.mySpellTrapZone.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        isFaceDown: card.isFaceDown,
        effects: getCardEffectsArray(card.ability),
      })),
      fieldSpell: gameState.myFieldSpell
        ? {
            instanceId: gameState.myFieldSpell._id,
            cardId: gameState.myFieldSpell._id,
            name: gameState.myFieldSpell.name,
            imageUrl: gameState.myFieldSpell.imageUrl,
            cardType: gameState.myFieldSpell.cardType,
            rarity: gameState.myFieldSpell.rarity,
            archetype: gameState.myFieldSpell.archetype,
            isFaceDown: false, // Field spells are always face-up
            effects: getCardEffectsArray(gameState.myFieldSpell.ability),
          }
        : null,
      graveyard: gameState.myGraveyard.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        monsterStats:
          card.cardType === "stereotype"
            ? {
                attack: card.attack,
                defense: card.defense,
                level: card.cost || 0,
              }
            : undefined,
        effects: getCardEffectsArray(card.ability),
        isFaceDown: false,
      })),
      graveyardCount: gameState.myGraveyard.length,
      deckCount: gameState.myDeckCount,
      normalSummonsRemaining: gameState.myNormalSummonedThisTurn ? 0 : 1,
    };
  }, [gameState, currentPlayerId, currentUser]);

  const opponent = useMemo<PlayerBoard | null>(() => {
    if (!gameState) return null;

    return {
      playerId: gameState.opponentId,
      playerName: gameState.isAIOpponent ? (gameState.opponentUsername || "CPU") : gameState.opponentUsername,
      playerType: gameState.isAIOpponent ? "ai" : "human",
      isActivePlayer: !gameState.isYourTurn,
      lifePoints: gameState.opponentLifePoints,
      maxLifePoints: 8000,
      hand: [], // Opponent's hand is hidden
      handCount: gameState.opponentHandCount,
      frontline: null,
      support: gameState.opponentBoard.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        attack: card.currentAttack,
        defense: card.currentDefense,
        position: card.position === 1 ? "attack" : "defense",
        hasAttacked: card.hasAttacked,
        isFaceDown: card.isFaceDown,
        monsterStats: {
          attack: card.currentAttack,
          defense: card.currentDefense,
          level: card.cost || 0, // cost represents the stereotype level/tribute requirement
        },
        effects: getCardEffectsArray(card.ability),
      })),
      backrow: gameState.opponentSpellTrapZone.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        isFaceDown: card.isFaceDown,
        effects: getCardEffectsArray(card.ability),
      })),
      fieldSpell: gameState.opponentFieldSpell
        ? {
            instanceId: gameState.opponentFieldSpell._id,
            cardId: gameState.opponentFieldSpell._id,
            name: gameState.opponentFieldSpell.name,
            imageUrl: gameState.opponentFieldSpell.imageUrl,
            cardType: gameState.opponentFieldSpell.cardType,
            rarity: gameState.opponentFieldSpell.rarity,
            archetype: gameState.opponentFieldSpell.archetype,
            isFaceDown: false, // Field spells are always face-up
            effects: getCardEffectsArray(gameState.opponentFieldSpell.ability),
          }
        : null,
      graveyard: gameState.opponentGraveyard.map((card) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        monsterStats:
          card.cardType === "stereotype"
            ? {
                attack: card.attack,
                defense: card.defense,
                level: card.cost || 0,
              }
            : undefined,
        effects: getCardEffectsArray(card.ability),
        isFaceDown: false,
      })),
      graveyardCount: gameState.opponentGraveyard.length,
      deckCount: gameState.opponentDeckCount,
      normalSummonsRemaining: 1,
    };
  }, [gameState]);

  const phase = useMemo<GamePhase | null>(() => {
    if (!gameState) return null;

    return {
      turnNumber: gameState.turnNumber,
      activePlayerId: gameState.isYourTurn ? currentPlayerId : gameState.opponentId,
      currentPhase: gameState.currentPhase,
    };
  }, [gameState, currentPlayerId]);

  // Map available actions to ValidActions interface
  const validActions = useMemo<ValidActions | null>(() => {
    if (!availableActions) return null;

    return {
      isYourTurn: gameState?.isYourTurn ?? false,
      currentPhase: gameState?.currentPhase,
      canNormalSummon: availableActions.actions.includes("normalSummon"),
      canSetMonster: availableActions.actions.includes("setMonster"),
      canSetSpellTrap: availableActions.actions.includes("setSpellTrap"),
      canActivateSpell: availableActions.actions.includes("activateSpell"),
      canActivateTrap: availableActions.actions.includes("activateTrap"),
      canAttack: availableActions.actions.includes("attack"),
      canAdvancePhase: availableActions.actions.includes("advancePhase"),
      canEndTurn: availableActions.actions.includes("endTurn"),
    };
  }, [availableActions, gameState]);

  // Playable hand cards
  const playableHandCards = useMemo(() => {
    if (!validActions || !gameState) return new Set<Id<"cardDefinitions">>();

    const playable = new Set<Id<"cardDefinitions">>();

    // Add summonable monsters
    validActions.summonableMonsters?.forEach((id) => playable.add(id));

    // Add settable monsters
    validActions.settableMonsters?.forEach((id) => playable.add(id));

    // Add settable spell/traps
    validActions.settableSpellTraps?.forEach((id) => playable.add(id));

    // Add activatable spells
    validActions.activatableSpells?.forEach((id) => playable.add(id));

    // Add activatable field cards
    validActions.activatableFieldCards?.forEach((id) => playable.add(id));

    return playable;
  }, [validActions, gameState]);

  // Activatable backrow cards
  const activatableBackrowCards = useMemo(() => {
    if (!gameState || !player) return new Set<Id<"cardDefinitions">>();

    const activatable = new Set<Id<"cardDefinitions">>();

    // Check each card in player's backrow
    for (const card of player.backrow) {
      const isTrap = card.cardType === "trap";
      const isQuickPlaySpell = card.cardType === "spell" && card.isFaceDown; // Quick-play if set face-down
      const isNormalSpell = card.cardType === "spell" && !card.isFaceDown;

      // Trap cards can be activated any time (opponent's turn or player's turn)
      if (isTrap && card.isFaceDown) {
        activatable.add(card.instanceId);
      }

      // Quick-Play spells (set face-down) can be activated any time
      if (isQuickPlaySpell) {
        activatable.add(card.instanceId);
      }

      // Normal spells (face-up or just set) can only be activated during player's Main Phase
      if (isNormalSpell && isPlayerTurn && isMainPhase) {
        activatable.add(card.instanceId);
      }
    }

    return activatable;
  }, [gameState, player, isPlayerTurn, isMainPhase]);

  // Attack options - compute which stereotypes can attack
  const attackOptions = useMemo(() => {
    if (!player || !isBattlePhase || !isPlayerTurn) return [];

    const options: Array<{
      instanceId: Id<"cardDefinitions">;
      name: string;
      canAttack: boolean;
      canDirectAttack: boolean;
      validTargets: Id<"cardDefinitions">[];
    }> = [];

    // Get all valid attack targets (opponent's stereotypes)
    const validTargets: Id<"cardDefinitions">[] = [];
    if (opponent?.frontline) {
      validTargets.push(opponent.frontline.instanceId);
    }
    if (opponent?.support) {
      for (const card of opponent.support) {
        validTargets.push(card.instanceId);
      }
    }

    // Check if opponent has any face-up stereotypes
    const opponentHasStereotypes = validTargets.length > 0;

    // Check frontline stereotype
    if (player.frontline) {
      const monster = player.frontline;
      // Position can be 1 (attack), -1 (defense), or string "attack"/"defense"/"setDefense"
      const isInAttackPosition = monster.position === 1 || monster.position === "attack";
      const canAttack = !monster.hasAttacked && !monster.isFaceDown && isInAttackPosition;

      if (canAttack) {
        options.push({
          instanceId: monster.instanceId,
          name: monster.name || "Unknown",
          canAttack: true,
          canDirectAttack: !opponentHasStereotypes,
          validTargets: validTargets,
        });
      }
    }

    // Check support stereotypes
    if (player.support) {
      for (const monster of player.support) {
        // Position can be 1 (attack), -1 (defense), or string "attack"/"defense"/"setDefense"
        const isInAttackPosition = monster.position === 1 || monster.position === "attack";
        const canAttack = !monster.hasAttacked && !monster.isFaceDown && isInAttackPosition;

        if (canAttack) {
          options.push({
            instanceId: monster.instanceId,
            name: monster.name || "Unknown",
            canAttack: true,
            canDirectAttack: !opponentHasStereotypes,
            validTargets: validTargets,
          });
        }
      }
    }

    return options;
  }, [player, opponent, isBattlePhase, isPlayerTurn]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    player,
    opponent,
    playerId: currentPlayerId,
    phase,
    validActions,
    attackOptions,
    pendingAction: gameState?.pendingAction, // Now implemented via chain system
    chainResponses: chainState
      ? {
          chain: chainState.chain,
          priorityPlayer: chainState.priorityPlayer,
          canRespond: chainState.priorityPlayer === currentPlayerId,
        }
      : undefined,
    responseWindow: gameState?.responseWindow,
    battleSubPhase:
      gameState?.responseWindow?.type === "attack_declaration"
        ? ("battle_step" as const)
        : gameState?.responseWindow?.type === "damage_calculation"
          ? ("damage_step" as const)
          : undefined,

    // Computed
    isLoading,
    isPlayerTurn,
    currentPhase,
    isMainPhase,
    isBattlePhase,
    gameEnded,
    winner,
    playableHandCards,
    activatableBackrowCards,

    // Actions
    normalSummon,
    setMonster,
    setSpellTrap,
    advancePhase,
    endTurn,
    declareAttack,
    forfeitGame,
    activateSpell,
    activateFieldSpell,
    activateTrap,
    activateMonsterEffect,
    respondToChain,
    passResponseWindow,
  };
}

export type UseGameBoardReturn = ReturnType<typeof useGameBoard>;
