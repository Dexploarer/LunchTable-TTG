"use client";

import { toBlob, toPng } from "html-to-image";
import { useCallback, useState } from "react";

interface UseScreenCaptureReturn {
  capture: () => Promise<Blob | null>;
  captureAsDataUrl: () => Promise<string | null>;
  isCapturing: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for capturing screenshots of the current page.
 *
 * Uses html-to-image to render the document body as an image.
 * Excludes the feedback widget itself from the capture.
 *
 * @example
 * ```typescript
 * const { capture, isCapturing, error } = useScreenCapture();
 *
 * const handleCapture = async () => {
 *   const blob = await capture();
 *   if (blob) {
 *     // Upload or display the screenshot
 *   }
 * };
 * ```
 */
export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const captureAsDataUrl = useCallback(async (): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      // Get the target element (main content, excluding feedback widget)
      const targetElement = document.body;

      if (!targetElement) {
        throw new Error("Could not find document body");
      }

      // Capture with options to exclude the feedback widget
      const dataUrl = await toPng(targetElement, {
        quality: 0.9,
        backgroundColor: "#1a1a1a", // Dark background for game UI
        filter: (node: HTMLElement) => {
          // Exclude feedback widget and any modals
          if (node.id === "feedback-widget") return false;
          if (node.getAttribute?.("data-feedback-exclude") === "true") return false;
          return true;
        },
        // Skip cross-origin images that would taint the canvas
        skipAutoScale: false,
        cacheBust: true,
      });

      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Screenshot capture failed";
      console.error("Screenshot capture error:", err);
      setError(message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const targetElement = document.body;

      if (!targetElement) {
        throw new Error("Could not find document body");
      }

      const blob = await toBlob(targetElement, {
        quality: 0.9,
        backgroundColor: "#1a1a1a",
        filter: (node: HTMLElement) => {
          if (node.id === "feedback-widget") return false;
          if (node.getAttribute?.("data-feedback-exclude") === "true") return false;
          return true;
        },
        skipAutoScale: false,
        cacheBust: true,
      });

      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Screenshot capture failed";
      console.error("Screenshot capture error:", err);
      setError(message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return {
    capture,
    captureAsDataUrl,
    isCapturing,
    error,
    clearError,
  };
}
