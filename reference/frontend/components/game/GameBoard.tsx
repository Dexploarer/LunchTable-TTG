"use client";

import { Button } from "@/components/ui/button";
import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import { componentLogger, useDebugLifecycle } from "@/lib/debug";
import type { Id } from "@convex/_generated/dataModel";
import { Link, useNavigate } from "@tanstack/react-router";
import { Flag, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { AgentActivityIndicator } from "./AgentActivityIndicator";
import { GameResultScreen } from "./GameResultScreen";
import { TutorialManager } from "./TutorialManager";
import { LifePointsBar } from "./board/LifePointsBar";
import { OpponentBoard } from "./board/OpponentBoard";
import { PlayerBoard } from "./board/PlayerBoard";
import { PlayerHand } from "./board/PlayerHand";
import { ActionButtons } from "./controls/ActionButtons";
import { PhaseBar } from "./controls/PhaseBar";
import { type GamePhase, PhaseSkipButtons } from "./controls/PhaseSkipButtons";
import { PriorityIndicator } from "./controls/PriorityIndicator";
import { TimeoutDisplay } from "./controls/TimeoutDisplay";
import { ActivateCardModal } from "./dialogs/ActivateCardModal";
import { AttackModal } from "./dialogs/AttackModal";
import { CardInspectorModal } from "./dialogs/CardInspectorModal";
import { CardSelectionModal } from "./dialogs/CardSelectionModal";
import { ChainDisplayWidget } from "./dialogs/ChainDisplayWidget";
import { CostPaymentModal } from "./dialogs/CostPaymentModal";
import { ForfeitDialog } from "./dialogs/ForfeitDialog";
import { OptionalTriggerPrompt } from "./dialogs/OptionalTriggerPrompt";
import { ResponsePrompt } from "./dialogs/ResponsePrompt";
import { SummonModal } from "./dialogs/SummonModal";
import { EffectFeedback, useEffectFeedback } from "./effects/EffectFeedback";
import { EffectQueueWidget, type QueuedEffect } from "./effects/EffectQueueWidget";
import { useGameBoard } from "./hooks/useGameBoard";
import { useGameInteraction } from "./hooks/useGameInteraction";

interface GameBoardProps {
  lobbyId: Id<"gameLobbies">;
  playerId?: Id<"users">;
  gameMode?: "pvp" | "story";
}

interface ChainLink {
  cardId: Id<"cardDefinitions">;
  effect: string;
  spellSpeed: number;
  playerId: Id<"users">;
  chainLink?: number;
  cardName?: string;
}

export function GameBoard({
  lobbyId,
  playerId: providedPlayerId,
  gameMode: gameModeOverride,
}: GameBoardProps) {
  const log = componentLogger("GameBoard");
  const navigate = useNavigate();

  // First check lobby status - MUST be called before any conditional returns
  const lobbyDetails = useConvexQuery(typedApi.gameplay.games.queries.getLobbyDetails, { lobbyId });

  // Auto-detect game mode from lobby if not explicitly set
  const gameMode = gameModeOverride ?? (lobbyDetails?.mode === "story" ? "story" : "pvp");

  // Debug lifecycle
  useDebugLifecycle("GameBoard", { lobbyId, gameMode });

  // Get player ID from auth if not provided (story mode)
  const authUser = useConvexQuery(typedApi.core.users.currentUser, {});
  const playerId = providedPlayerId || (authUser?._id as Id<"users"> | undefined);

  log.debug("GameBoard rendered", { lobbyId, playerId, gameMode });

  const gameBoard = useGameBoard(lobbyId, playerId ?? ("" as Id<"users">));
  const {
    player,
    opponent,
    phase,
    validActions,
    pendingAction,
    chainResponses,
    responseWindow,
    battleSubPhase,
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
    respondToChain,
  } = gameBoard;

  const {
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
  } = useGameInteraction(lobbyId, gameBoard, gameMode);

  // Effect Feedback System
  const effectFeedback = useEffectFeedback();
  const [effectQueue, _setEffectQueue] = useState<QueuedEffect[]>([]);

  // Player ID check - MUST happen after all hooks are called
  if (!playerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0a09]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // Waiting for opponent state
  if (lobbyDetails && lobbyDetails.status === "waiting") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0a09]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-[#3d2b1f] bg-black/40">
          <Users className="h-16 w-16 text-[#d4af37] animate-pulse" />
          <h2 className="text-2xl font-bold text-[#e8e0d5]">Waiting for Opponent</h2>
          <p className="text-sm text-[#a89f94] text-center max-w-md">
            Your game lobby is ready. Share your join code or wait for someone to join from the
            lobby list.
          </p>
          {lobbyDetails.joinCode && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-xs text-[#a89f94]">Private Game Code:</p>
              <div className="px-4 py-2 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/30">
                <p
                  className="text-2xl font-mono font-bold text-[#d4af37] tracking-wider"
                  data-testid="game-code"
                >
                  {lobbyDetails.joinCode}
                </p>
              </div>
            </div>
          )}
          <Loader2 className="h-6 w-6 animate-spin text-[#d4af37] mt-2" />
          <Button asChild variant="outline" className="mt-4">
            <Link to="/lunchtable">Back to Lobby</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0a09]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading game...</span>
        </div>
      </div>
    );
  }

  // Game ended state
  if (gameEnded) {
    const isWinner = winner === "player";
    const returnLink = gameMode === "story" ? "/play/story" : "/lunchtable";

    const playerFieldCount =
      (player?.support?.length ?? 0) + (player?.backrow?.length ?? 0) + (player?.frontline ? 1 : 0);
    const playerDamageReceived = player?.maxLifePoints
      ? player.maxLifePoints - (player?.lifePoints ?? 0)
      : 0;
    const opponentDamageReceived = opponent?.maxLifePoints
      ? opponent.maxLifePoints - (opponent?.lifePoints ?? 0)
      : 0;

    return (
      <GameResultScreen
        result={isWinner ? "victory" : "defeat"}
        playerName={player?.playerName ?? "Player"}
        opponentName={opponent?.playerName ?? "Opponent"}
        stats={{
          damageDealt: opponentDamageReceived,
          damageReceived: playerDamageReceived,
          cardsPlayed: playerFieldCount,
          stereotypesDestroyed: 0,
          spellsCast: 0,
          turnsPlayed: phase?.turnNumber ?? 0,
          matchDuration: 0,
        }}
        rewards={{
          gold: isWinner ? 100 : 25,
          xp: isWinner ? 50 : 10,
        }}
        gameMode={gameMode === "story" ? "story" : "casual"}
        isOpen={true}
        onReturnToMenu={() => {
          navigate({ to: returnLink });
        }}
      />
    );
  }

  // No data state
  if (!player || !opponent || !phase) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0a09]">
        <div className="text-xs text-muted-foreground">Game data not available</div>
      </div>
    );
  }

  // Determine summon options based on card type
  const isCreature = selectedHandCard?.cardType === "stereotype";
  const isSpell = selectedHandCard?.cardType === "spell";
  const isTrap = selectedHandCard?.cardType === "trap";

  const canSummonAttack = isCreature && (validActions?.canNormalSummon ?? false);
  const canSummonDefense = isCreature && (validActions?.canNormalSummon ?? false);
  const canSetMonster = isCreature && (validActions?.canSetMonster ?? false);
  const canSetSpellTrap = (isSpell || isTrap) && (validActions?.canSetSpellTrap ?? false);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-arena flex flex-col h-dvh"
      data-testid="game-board"
      role="application"
      aria-label={`Game board - ${isPlayerTurn ? "Your turn" : "Opponent's turn"} - ${currentPhase} phase`}
    >
      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="absolute inset-0 bg-vignette z-0 pointer-events-none" />

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPlayerTurn ? "Your turn" : "Opponent's turn"}, {currentPhase} phase. Your life points:{" "}
        {player?.lifePoints ?? 0}. Opponent life points: {opponent?.lifePoints ?? 0}.
      </div>

      {/* Game Content Container - full height, no scroll */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Top Bar: Opponent Life Points + Timeout + Forfeit Button */}
        <div className="px-2 pt-2 flex items-center justify-between gap-2 shrink-0">
          <LifePointsBar
            playerName={opponent.playerName}
            lifePoints={opponent.lifePoints}
            maxLifePoints={opponent.maxLifePoints}
            isOpponent
            isActive={!isPlayerTurn}
            isAi={opponent.playerType === "ai"}
          />
          <div className="flex items-center gap-2">
            {/* Timeout Display */}
            {timeoutStatus && (
              <TimeoutDisplay
                actionTimeRemainingMs={timeoutStatus.actionTimeRemainingMs}
                matchTimeRemainingMs={timeoutStatus.matchTimeRemainingMs}
                isWarning={timeoutStatus.isWarning}
                isTimedOut={timeoutStatus.isTimedOut}
                isMatchTimedOut={timeoutStatus.isMatchTimedOut}
                className="hidden sm:flex"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForfeitDialog(true)}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2"
            >
              <Flag className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Forfeit</span>
            </Button>
          </div>
        </div>

        {/* Opponent Hand */}
        <section className="shrink-0" aria-label={`Opponent's hand: ${opponent.handCount} cards`}>
          <PlayerHand cards={[]} handCount={opponent.handCount} isOpponent />
        </section>

        {/* Opponent Board */}
        <section className="border-b border-slate-700/50 shrink-0" aria-label="Opponent's field">
          <OpponentBoard
            board={opponent}
            selectedCard={selectedFieldCard?.instanceId}
            targetableCards={targetableCards}
            onCardClick={handleFieldCardClick}
          />
        </section>

        {/* Phase Bar (Center) */}
        <div className="px-2 py-1 border-y border-white/5 bg-black/40 backdrop-blur-sm shrink-0">
          <PhaseBar
            currentPhase={currentPhase}
            turnNumber={phase.turnNumber}
            isPlayerTurn={isPlayerTurn}
            canAdvancePhase={validActions?.canAdvancePhase ?? false}
            onAdvancePhase={handleAdvancePhase}
            onEndTurn={handleEndTurn}
            battleSubPhase={battleSubPhase}
            isChainResolving={
              (chainResponses?.chain?.length ?? 0) > 0 && !chainResponses?.canRespond
            }
            isOpponentResponding={!!responseWindow && responseWindow.activePlayerId !== playerId}
          />
        </div>

        {/* Player Board */}
        <section className="border-b border-white/5 shrink-0" aria-label="Your field">
          <PlayerBoard
            board={player}
            selectedCard={selectedFieldCard?.instanceId}
            attackingCard={phase.attackingCardId}
            targetableCards={targetableCards}
            attackableCards={attackableAttackers}
            onCardClick={handleFieldCardClick}
            onCardAttack={handleMonsterAttackClick}
            onEmptyBackrowClick={handleSetSpellTrap}
            activatableBackrowCards={activatableBackrowCards}
            onBackrowCardClick={handleBackrowCardClick}
          />
        </section>

        {/* Player Hand - flexible, takes remaining space */}
        <section
          className="flex-1 min-h-0 border-b border-white/5 bg-black/20 overflow-visible relative"
          aria-label={`Your hand: ${player.hand.length} cards`}
        >
          <div className="absolute inset-0 bg-linear-to-t from-primary/5 to-transparent pointer-events-none" />
          <PlayerHand
            cards={player.hand}
            handCount={player.hand.length}
            playableCards={playableHandCards}
            selectedCard={selectedHandCard?.instanceId}
            onCardClick={handleHandCardClick}
          />
        </section>

        {/* Player Life Points & Actions */}
        <section
          className="px-2 py-1.5 flex items-center justify-between gap-2 shrink-0"
          aria-label="Your status and actions"
        >
          <LifePointsBar
            playerName={player.playerName}
            lifePoints={player.lifePoints}
            maxLifePoints={player.maxLifePoints}
            isActive={isPlayerTurn}
          />

          <div className="flex items-center gap-2">
            {/* Phase Skip Buttons */}
            <PhaseSkipButtons
              lobbyId={lobbyId}
              currentPhase={currentPhase as GamePhase}
              isCurrentPlayerTurn={isPlayerTurn}
            />

            <ActionButtons
              isPlayerTurn={isPlayerTurn}
              isBattlePhase={isBattlePhase}
              canAttack={canAttack}
              canEndTurn={validActions?.canEndTurn ?? false}
              onEndTurn={handleEndTurn}
              onAttack={() => {
                if (defaultAttacker) {
                  setSelectedFieldCard(defaultAttacker);
                  setShowAttackModal(true);
                }
              }}
            />
          </div>
        </section>

        {/* Modals */}
        <SummonModal
          isOpen={showSummonModal}
          card={selectedHandCard}
          canSummonAttack={canSummonAttack ?? false}
          canSummonDefense={canSummonDefense ?? false}
          canSet={
            selectedHandCard?.cardType === "stereotype"
              ? (canSetMonster ?? false)
              : (canSetSpellTrap ?? false)
          }
          canActivate={
            selectedHandCard?.cardType === "spell" && (validActions?.canActivateSpell ?? false)
          }
          tributesRequired={
            selectedHandCard?.monsterStats?.level
              ? selectedHandCard.monsterStats.level >= 7
                ? 2
                : selectedHandCard.monsterStats.level >= 5
                  ? 1
                  : 0
              : 0
          }
          availableTributes={
            player?.frontline || player?.support?.length > 0
              ? [...(player.frontline ? [player.frontline] : []), ...(player.support || [])].filter(
                  (card) => !card.isFaceDown
                )
              : []
          }
          onSummon={handleSummon}
          onSet={
            selectedHandCard?.cardType === "stereotype" ? handleSetMonster : handleSetSpellTrap
          }
          onActivate={handleHandCardActivate}
          onClose={() => {
            setShowSummonModal(false);
            setSelectedHandCard(null);
          }}
        />

        <AttackModal
          isOpen={showAttackModal}
          attacker={selectedAttackOption}
          targets={attackTargets}
          canDirectAttack={selectedAttackOption?.canDirectAttack ?? false}
          onSelectTarget={handleDeclareAttack}
          onClose={() => {
            setShowAttackModal(false);
            setSelectedFieldCard(null);
          }}
        />

        <ForfeitDialog
          isOpen={showForfeitDialog}
          onConfirm={handleForfeit}
          onCancel={() => setShowForfeitDialog(false)}
          isLoading={isForfeitLoading}
        />

        <ActivateCardModal
          isOpen={showActivateModal}
          card={selectedBackrowCard || selectedFieldCard}
          canActivate={
            selectedBackrowCard
              ? activatableBackrowCards.has(selectedBackrowCard.instanceId)
              : selectedFieldCard
                ? isPlayerTurn && isMainPhase
                : false
          }
          onActivate={handleActivateCard}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedBackrowCard(null);
            setSelectedFieldCard(null);
          }}
        />

        <ResponsePrompt
          isOpen={showBattleResponseWindow || (!!pendingAction && responseCards.length > 0)}
          actionType={showBattleResponseWindow ? battleResponseActionType : "chain_response"}
          responseCards={showBattleResponseWindow ? battleResponseCards : responseCards}
          timeRemaining={
            responseWindow?.expiresAt ? Math.max(0, responseWindow.expiresAt - Date.now()) : 30000
          }
          onActivate={handleChainResponse}
          onPass={showBattleResponseWindow ? handlePassResponseWindow : handlePassChain}
        />

        {/* Opponent responding indicator — shown when AI has priority in response window */}
        {responseWindow && responseWindow.activePlayerId !== playerId && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-black/80 border border-orange-500/40 backdrop-blur-sm flex items-center gap-2 shadow-lg shadow-orange-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-sm font-medium text-orange-300">Opponent is responding...</span>
          </div>
        )}

        <CardInspectorModal
          isOpen={showCardInspector}
          card={inspectedCard}
          isOpponentCard={isInspectedOpponent}
          onClose={() => {
            setShowCardInspector(false);
            setInspectedCard(null);
          }}
        />

        <CardSelectionModal
          isOpen={!!cardSelection}
          cards={cardSelection?.cards || []}
          zone={cardSelection?.zone || "deck"}
          selectionMode={cardSelection?.selectionMode || "single"}
          minSelections={cardSelection?.minSelections || 1}
          maxSelections={cardSelection?.maxSelections || 1}
          title={cardSelection?.title}
          description={cardSelection?.description}
          onConfirm={(selectedIds) => {
            if (cardSelection?.callback) {
              cardSelection.callback(selectedIds);
            }
            setCardSelection(null);
          }}
          onCancel={() => setCardSelection(null)}
        />

        {/* Cost Payment Modal */}
        {costPayment && (
          <CostPaymentModal
            isOpen={true}
            costType={costPayment.costType}
            costValue={costPayment.costValue}
            currentLP={player?.lifePoints}
            availableCards={costPayment.availableCards}
            sourceCardName={costPayment.cardName}
            onConfirm={(selectedCardIds) => {
              costPayment.callback(selectedCardIds);
              setCostPayment(null);
            }}
            onCancel={() => {
              setCostPayment(null);
            }}
          />
        )}

        {/* Optional Trigger Prompt */}
        {playerId && pendingOptionalTriggers && pendingOptionalTriggers.length > 0 && (
          <OptionalTriggerPrompt
            pendingTriggers={pendingOptionalTriggers}
            lobbyId={lobbyId}
            currentPlayerId={playerId}
            onClose={() => {
              // Component manages its own state - closing handled internally
            }}
          />
        )}

        {/* Chain Display Widget */}
        {chainResponses?.chain && chainResponses.chain.length > 0 && (
          <ChainDisplayWidget
            chain={chainResponses.chain.map((c: ChainLink) => ({
              chainPosition: c.chainLink || 1,
              cardId: c.cardId,
              cardName: c.cardName || "Unknown Card",
              effectName: typeof c.effect === "string" ? c.effect : "Effect",
              spellSpeed: (c.spellSpeed || 1) as 1 | 2 | 3,
              playerId: c.playerId,
            }))}
            currentPlayerId={playerId}
            isResolving={false}
          />
        )}

        {/* Priority Indicator */}
        {chainResponses?.priorityPlayer && (
          <PriorityIndicator
            isOpen={true}
            windowType="open"
            hasPriority={chainResponses.canRespond}
            isChainOpen={chainResponses.chain && chainResponses.chain.length > 0}
            onPass={async () => {
              await respondToChain("pass");
            }}
          />
        )}

        {/* Effect Feedback System */}
        <EffectFeedback
          floatingNumbers={effectFeedback.floatingNumbers}
          animations={effectFeedback.animations}
        />

        {/* Effect Queue Widget */}
        {effectQueue.length > 0 && <EffectQueueWidget effects={effectQueue} isResolving={false} />}

        {/* elizaOS Agent Activity Indicator */}
        <AgentActivityIndicator lobbyId={lobbyId} />

        {/* Tutorial Manager (Story Mode Only) */}
        {gameMode === "story" && player && opponent && phase && (
          <TutorialManager
            enabled={true}
            gameState={{
              currentPhase: currentPhase,
              isPlayerTurn,
              turnNumber: phase.turnNumber,
              myLifePoints: player.lifePoints,
              opponentLifePoints: opponent.lifePoints,
              myHand: player.hand || [],
              myField: [
                ...(player.support || []),
                ...(player.backrow || []),
                ...(player.frontline ? [player.frontline] : []),
              ],
            }}
          />
        )}
      </div>
    </div>
  );
}
