/**
 * Centralized error handling utilities for type-safe error management
 */

/**
 * Extract a safe error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }

  return "An unexpected error occurred";
}

/**
 * Handle hook errors with fallback message
 */
export function handleHookError(error: unknown, fallbackMessage: string): string {
  const message = getErrorMessage(error);
  return message || fallbackMessage;
}

/**
 * Type guard to check if error is a Convex error with specific structure
 */
export function isConvexError(error: unknown): error is { message: string; code?: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

/**
 * Log error safely with context
 */
export function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, error.stack);
  } else {
    console.error(`[${context}]`, String(error));
  }
}
