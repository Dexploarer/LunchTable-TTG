/**
 * Hooks Barrel Export
 *
 * Centralized export for all custom hooks organized by domain.
 * Import any hook with: import { useHookName } from "@/hooks"
 */

// Shared Types
export type {
  BaseHookReturn,
  HookWithError,
  MutationHookReturn,
  ActionResult,
  PaginationState,
  SortOption,
  CardDisplay,
  DeckDisplay,
  UserProfileSummary,
  GameMode,
  PlayerStatus,
} from "@/types";
export { isSortOption, isGameMode, isPlayerStatus } from "@/types";

// Auth Hooks
// Use usePrivy, useLogin, useLogout from "@privy-io/react-auth" for authentication
// User data is synced to Convex via auth/syncUser mutations

// Game Hooks
export { useGameLobby } from "./game/useGameLobby";
export { useSpectator } from "./game/useSpectator";
export { useMatchmaking } from "./game/useMatchmaking";

// Collection Hooks
export { useDeckBuilder, useDeck, useValidateDeck } from "./collection/useDeckBuilder";
export { useCardBinder } from "./collection/useCardBinder";
export { useCardCollection } from "./collection/useCardCollection";
export { useDeckEditor } from "./collection/useDeckEditor";
export { useBinderInteraction } from "./collection/useBinderInteraction";

// Economy Hooks
export * from "./economy/useCurrency";
export * from "./economy/useMarketplace";
export * from "./economy/useShop";
export * from "./economy/useShopInteraction";
export * from "./economy/useLunchMoneyInteraction";
export * from "./marketplace/useTokenPurchase";
export * from "./social/useSettingsInteraction";
export * from "./marketplace/useTokenListing";
export * from "./social/useInboxInteraction";

// Social & Profile Hooks
export * from "./social/useUserProfile";
export * from "./social/useFriendsInteraction";
export * from "./social/useProfile";
export * from "./social/useTournament";

// Game & Tournament Hooks
export * from "./game/useTournamentInteraction";

// Onboarding & Logic Hooks
export * from "./onboarding/useLunchtableLogic";

export { useLeaderboard } from "./social/useLeaderboard";
export * from "./social/useLeaderboardInteraction";

export { usePlayerCard } from "./social/usePlayerCard";
export { useTournaments, useTournament, useTournamentHistory } from "./social/useTournament";
export type {
  TournamentStatus,
  TournamentMode,
  ParticipantStatus,
  MatchStatus,
  TournamentPrizePool,
  TournamentSummary,
  TournamentDetails,
  TournamentParticipant,
  TournamentMatch,
  TournamentRound,
  TournamentBracket,
  TournamentHistoryEntry,
  UserTournamentStats,
} from "./social/useTournament";

// Progression & Battle Pass Hooks
export * from "./progression/useBattlePass";
export * from "./progression/useBattlePassInteraction";
export * from "./progression/useQuests";
export * from "./progression/useQuestsInteraction";
export * from "./progression/useAchievements";
export * from "./progression/useMatchHistoryInteraction";
export { useNotifications } from "./progression/useNotifications";
export { useBattlePass } from "./progression/useBattlePass";

// Wallet Hooks
export { useGameWallet } from "./wallet/useGameWallet";
export type { UseGameWalletReturn, WalletType } from "./wallet/useGameWallet";
