"use client";

import { useMutation } from "convex/react";
import { toast } from "sonner";
import { handleHookError } from "./errorHandling";

type MutationMessages = {
  success?: string;
  error: string;
};

/**
 * Wrapper for Convex mutations with built-in toast notifications and error handling.
 * Eliminates repetitive try-catch-toast patterns across hooks.
 *
 * @example
 * const joinGuild = useMutationWithToast(
 *   api.social.guilds.members.joinPublicGuild,
 *   { success: "Joined guild!", error: "Failed to join guild" }
 * );
 *
 * // Then in your component:
 * await joinGuild({ guildId });
 */
export function useMutationWithToast<Args extends Record<string, unknown>, Result = unknown>(
  mutationRef: Parameters<typeof useMutation>[0],
  messages: MutationMessages
) {
  const mutation = useMutation(mutationRef);

  return async (args: Args): Promise<Result> => {
    try {
      const result = (await mutation(args)) as Result;
      if (messages.success) {
        toast.success(messages.success);
      }
      return result;
    } catch (error) {
      const message = handleHookError(error, messages.error);
      toast.error(message);
      throw error;
    }
  };
}

/**
 * Variant that doesn't throw on error - useful when you want to handle errors silently
 * or when the error is already shown via toast.
 */
export function useMutationWithToastSafe<Args extends Record<string, unknown>, Result = unknown>(
  mutationRef: Parameters<typeof useMutation>[0],
  messages: MutationMessages
) {
  const mutation = useMutation(mutationRef);

  return async (args: Args): Promise<Result | null> => {
    try {
      const result = (await mutation(args)) as Result;
      if (messages.success) {
        toast.success(messages.success);
      }
      return result;
    } catch (error) {
      const message = handleHookError(error, messages.error);
      toast.error(message);
      return null;
    }
  };
}
