"use client";

import { SOL_MINT } from "@/lib/wagerTiers";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";
import { useGameWallet } from "./useGameWallet";

// SPL Token and Associated Token program IDs
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

interface UseCryptoWagerJoinReturn {
  joinWagerLobby: (lobbyId: string) => Promise<{ success: boolean; error?: string }>;
  isJoining: boolean;
  error: string | null;
}

/**
 * x402 Payment Requirements from PAYMENT-REQUIRED header
 */
interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
}

interface PaymentRequired {
  x402Version: number;
  resource?: {
    url: string;
    description?: string;
  };
  accepts: PaymentRequirements[];
}

/**
 * Hook for joining crypto wager lobbies using x402 payment protocol
 *
 * Handles the two-step x402 flow:
 * 1. First request returns 402 with payment requirements
 * 2. Build and sign deposit transaction
 * 3. Retry request with payment signature
 *
 * @example
 * ```typescript
 * const { joinWagerLobby, isJoining, error } = useCryptoWagerJoin();
 *
 * async function handleJoin() {
 *   const result = await joinWagerLobby(lobbyId);
 *   if (result.success) {
 *     router.push(`/game/${gameId}`);
 *   }
 * }
 * ```
 */
export function useCryptoWagerJoin(): UseCryptoWagerJoinReturn {
  const { walletAddress, solanaWallet, isConnected } = useGameWallet();

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWagerLobby = useCallback(
    async (lobbyId: string): Promise<{ success: boolean; error?: string }> => {
      if (!isConnected || !walletAddress || !solanaWallet) {
        const errorMsg = "Wallet not connected";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setIsJoining(true);
      setError(null);

      try {
        // Step 1: Make initial request (expect 402 response)
        const initialResponse = await fetch("/api/agents/matchmaking/wager-join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lobbyId }),
        });

        // Step 2: Handle 402 Payment Required response
        if (initialResponse.status === 402) {
          const paymentRequiredHeader = initialResponse.headers.get("PAYMENT-REQUIRED");

          if (!paymentRequiredHeader) {
            throw new Error("Missing PAYMENT-REQUIRED header in 402 response");
          }

          // Decode payment requirements
          const paymentRequired: PaymentRequired = JSON.parse(atob(paymentRequiredHeader));

          // Find supported payment method (Solana exact payment)
          const acceptedPayment = paymentRequired.accepts.find(
            (req) => req.scheme === "exact" && req.network.startsWith("solana:")
          );

          if (!acceptedPayment) {
            throw new Error("No supported payment method found");
          }

          // Step 3: Build the deposit transaction
          const rpcUrl =
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
          const connection = new Connection(rpcUrl, "confirmed");

          const fromPubkey = new PublicKey(walletAddress);
          const toPubkey = new PublicKey(acceptedPayment.payTo);
          const amountLamports = BigInt(acceptedPayment.amount);

          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

          // Determine if this is SOL or SPL token transfer
          const isSolTransfer = acceptedPayment.asset === SOL_MINT;

          let transaction: Transaction;

          if (isSolTransfer) {
            // SOL transfer (native)
            transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports: Number(amountLamports),
              })
            );
          } else {
            // SPL token transfer (USDC)
            // Follows the same manual instruction pattern as convex/lib/solana/tokenTransfer.ts
            const mintPubkey = new PublicKey(acceptedPayment.asset);

            // Derive sender and recipient ATAs
            const [senderAta] = PublicKey.findProgramAddressSync(
              [fromPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
              ASSOCIATED_TOKEN_PROGRAM_ID
            );
            const [recipientAta] = PublicKey.findProgramAddressSync(
              [toPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
              ASSOCIATED_TOKEN_PROGRAM_ID
            );

            // Create recipient ATA if it doesn't exist (idempotent instruction)
            transaction = new Transaction().add(
              new TransactionInstruction({
                keys: [
                  { pubkey: fromPubkey, isSigner: true, isWritable: true },
                  { pubkey: recipientAta, isSigner: false, isWritable: true },
                  { pubkey: toPubkey, isSigner: false, isWritable: false },
                  { pubkey: mintPubkey, isSigner: false, isWritable: false },
                  { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                  { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                ],
                programId: ASSOCIATED_TOKEN_PROGRAM_ID,
                data: Buffer.alloc(0),
              })
            );

            // SPL Token transfer instruction (index 3, 8-byte LE amount)
            const data = Buffer.alloc(9);
            data.writeUInt8(3, 0);
            data.writeBigUInt64LE(amountLamports, 1);

            transaction.add(
              new TransactionInstruction({
                keys: [
                  { pubkey: senderAta, isSigner: false, isWritable: true },
                  { pubkey: recipientAta, isSigner: false, isWritable: true },
                  { pubkey: fromPubkey, isSigner: true, isWritable: false },
                ],
                programId: TOKEN_PROGRAM_ID,
                data,
              })
            );
          }

          transaction.recentBlockhash = blockhash;
          transaction.lastValidBlockHeight = lastValidBlockHeight;
          transaction.feePayer = fromPubkey;

          // Step 4: Sign transaction via Privy wallet
          // biome-ignore lint/suspicious/noExplicitAny: Privy SDK v3 type mismatch — runtime accepts Transaction
          const signedTx = await (solanaWallet.signAndSendTransaction as any)({
            transaction: transaction.serialize({ requireAllSignatures: false }),
            chain: "solana:mainnet",
          });

          if (!signedTx.signature) {
            throw new Error("Transaction signing failed - no signature returned");
          }

          // Step 5: Build payment proof for retry
          const paymentPayload = {
            x402Version: paymentRequired.x402Version,
            resource: paymentRequired.resource,
            accepted: acceptedPayment,
            payload: {
              transaction: signedTx.signature,
            },
          };

          const paymentSignatureHeader = btoa(JSON.stringify(paymentPayload));

          // Step 6: Retry request with payment signature
          const retryResponse = await fetch("/api/agents/matchmaking/wager-join", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "PAYMENT-SIGNATURE": paymentSignatureHeader,
            },
            body: JSON.stringify({ lobbyId }),
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error?.message || `Payment verification failed: ${retryResponse.status}`
            );
          }

          // Payment verified and lobby joined successfully
          await retryResponse.json();

          setIsJoining(false);
          return { success: true };
        }

        // If not 402, check for other success/error responses
        if (initialResponse.ok) {
          // No payment required (shouldn't happen for crypto wagers, but handle it)
          setIsJoining(false);
          return { success: true };
        }

        // Other error status codes
        const errorData = await initialResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to join lobby: ${initialResponse.status}`
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to join wager lobby";
        setError(errorMsg);
        setIsJoining(false);
        return { success: false, error: errorMsg };
      }
    },
    [walletAddress, solanaWallet, isConnected]
  );

  return {
    joinWagerLobby,
    isJoining,
    error,
  };
}
