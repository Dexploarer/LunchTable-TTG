"use client";

import type { TransactionFilter } from "@/types/economy";
import { useState } from "react";
import { useLunchMoney } from "./useLunchMoney";
import { usePriceHistory } from "./usePriceHistory";
import { useTransactionHistory } from "./useTransactionHistory";

export type LunchMoneyTab = "overview" | "transactions" | "listings" | "prices" | "chart";

export function useLunchMoneyInteraction() {
  const [activeTab, setActiveTab] = useState<LunchMoneyTab>("overview");
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");

  const economy = useLunchMoney();
  const transactions = useTransactionHistory();
  const prices = usePriceHistory();

  return {
    // UI State
    activeTab,
    setActiveTab,
    transactionFilter,
    setTransactionFilter,

    // Data Modules
    economy,
    transactions,
    prices,

    // Combined Loading State
    isLoading: economy.isLoading, // Main loading state
  };
}
