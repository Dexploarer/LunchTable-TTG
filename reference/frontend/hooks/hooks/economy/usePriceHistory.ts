"use client";

/**
 * Price History Hook
 *
 * Provides card price history data for charts.
 */

import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface PriceDataPoint {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
  goldSales: number;
  tokenSales: number;
}

interface TopTradedCard {
  cardDefinitionId: string;
  name: string;
  rarity: string;
  archetype: string;
  imageUrl?: string;
  volume: number;
  totalValue: number;
  avgPrice: number;
  sales: number;
}

interface UsePriceHistoryReturn {
  // Selected card
  selectedCard: string | null;
  setSelectedCard: (cardId: string | null) => void;

  // Time range
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  // Price data
  priceHistory: PriceDataPoint[];
  isLoading: boolean;

  // Top traded cards for selector
  topCards: TopTradedCard[];
  isLoadingTopCards: boolean;

  // Summary stats
  avgPrice: number;
  priceChange: number;
  priceChangePercent: number;
  totalVolume: number;
}

/**
 * Card price history for charts and analysis.
 *
 * @example
 * ```tsx
 * const {
 *   priceHistory,
 *   topCards,
 *   selectedCard,
 *   setSelectedCard,
 *   timeRange,
 *   setTimeRange,
 *   avgPrice,
 *   priceChange,
 * } = usePriceHistory();
 *
 * return (
 *   <div>
 *     <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)}>
 *       {topCards.map(card => (
 *         <option key={card.cardDefinitionId} value={card.cardDefinitionId}>
 *           {card.name}
 *         </option>
 *       ))}
 *     </select>
 *     <AreaChart data={priceHistory} />
 *     <p>Avg Price: {avgPrice} | Change: {priceChangePercent}%</p>
 *   </div>
 * );
 * ```
 */
export function usePriceHistory(): UsePriceHistoryReturn {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Get top traded cards for selector
  const topCards = useConvexQuery(typedApi.economy.priceHistory.getTopTradedCards, {
    limit: 20,
    timeRange,
  });

  // Get price history for selected card (or all cards if none selected)
  const priceHistory = useConvexQuery(typedApi.economy.priceHistory.getCardPriceHistory, {
    cardDefinitionId: selectedCard ? (selectedCard as Id<"cardDefinitions">) : undefined,
    timeRange,
  });

  // Calculate summary stats
  const history: PriceDataPoint[] = priceHistory ?? [];
  const totalVolume = history.reduce((sum: number, d: PriceDataPoint) => sum + d.volume, 0);

  // Calculate average price
  const avgPrice =
    history.length > 0
      ? Math.round(
          history.reduce((sum: number, d: PriceDataPoint) => sum + d.avgPrice, 0) / history.length
        )
      : 0;

  // Calculate price change (first vs last data point)
  let priceChange = 0;
  let priceChangePercent = 0;
  if (history.length >= 2) {
    const firstPrice = history[0]?.avgPrice ?? 0;
    const lastPrice = history[history.length - 1]?.avgPrice ?? 0;
    priceChange = lastPrice - firstPrice;
    priceChangePercent = firstPrice > 0 ? Math.round((priceChange / firstPrice) * 100) : 0;
  }

  return {
    // Selected card
    selectedCard,
    setSelectedCard,

    // Time range
    timeRange,
    setTimeRange,

    // Price data
    priceHistory: history,
    isLoading: priceHistory === undefined,

    // Top cards
    topCards: topCards ?? [],
    isLoadingTopCards: topCards === undefined,

    // Summary
    avgPrice,
    priceChange,
    priceChangePercent,
    totalVolume,
  };
}
