"use client";

import { SOL_DECIMALS, USDC_DECIMALS, USDC_MINT } from "@/lib/wagerTiers";
import { Connection, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { useGameWallet } from "./useGameWallet";

interface UseCryptoBalanceReturn {
  solBalance: number | null;
  usdcBalance: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching SOL and USDC balances from connected Solana wallet
 *
 * Automatically refreshes when wallet changes. Provides manual refresh function
 * for updates after transactions.
 *
 * @example
 * ```typescript
 * const { solBalance, usdcBalance, isLoading, error, refresh } = useCryptoBalance();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     <p>SOL: {solBalance ?? "N/A"}</p>
 *     <p>USDC: {usdcBalance ?? "N/A"}</p>
 *     <button onClick={refresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useCryptoBalance(): UseCryptoBalanceReturn {
  const { walletAddress, isConnected, isLoading: walletLoading } = useGameWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    // Reset state if wallet not connected
    if (!isConnected || !walletAddress) {
      setSolBalance(null);
      setUsdcBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");
      const publicKey = new PublicKey(walletAddress);

      // Fetch SOL balance (native balance)
      const solLamports = await connection.getBalance(publicKey);
      const sol = solLamports / 10 ** SOL_DECIMALS;
      setSolBalance(sol);

      // Fetch USDC balance (SPL token)
      try {
        const usdcMintPubkey = new PublicKey(USDC_MINT);

        // Get all token accounts for this wallet filtered by USDC mint
        const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
          mint: usdcMintPubkey,
        });

        if (tokenAccounts.value.length > 0) {
          // Parse the token account data to get balance
          const accountInfo = tokenAccounts.value[0].account;
          const data = accountInfo.data;

          // Token account layout: first 32 bytes is mint, next 32 is owner, then 8 bytes for amount
          // Using buffer offset 64 to read the amount (8 bytes as u64)
          const amount = data.readBigUInt64LE(64);
          const usdc = Number(amount) / 10 ** USDC_DECIMALS;
          setUsdcBalance(usdc);
        } else {
          // No USDC token account exists yet
          setUsdcBalance(0);
        }
      } catch (usdcError) {
        console.error("Failed to fetch USDC balance:", usdcError);
        // Set USDC to 0 if there's an error (likely no token account)
        setUsdcBalance(0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch balances";
      setError(message);
      setSolBalance(null);
      setUsdcBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isConnected]);

  // Auto-refresh on mount and when wallet changes
  useEffect(() => {
    if (!walletLoading) {
      fetchBalances();
    }
  }, [walletLoading, fetchBalances]);

  return {
    solBalance,
    usdcBalance,
    isLoading,
    error,
    refresh: fetchBalances,
  };
}
