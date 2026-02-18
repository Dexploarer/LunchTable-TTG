"use client";

import { useCallback, useRef, useState } from "react";

interface UseRecordingReturn {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
  isSupported: boolean;
  error: string | null;
  clearError: () => void;
  recordingDuration: number;
}

const MAX_RECORDING_DURATION = Number(process.env.NEXT_PUBLIC_MAX_RECORDING_DURATION_MS || 30000);

/**
 * Hook for recording the user's screen.
 *
 * Uses the native MediaRecorder API with getDisplayMedia.
 * Limited to 30 seconds to keep file sizes manageable.
 *
 * @example
 * ```typescript
 * const { startRecording, stopRecording, isRecording, isSupported } = useRecording();
 *
 * if (isSupported) {
 *   const started = await startRecording();
 *   if (started) {
 *     // Recording in progress...
 *     const blob = await stopRecording();
 *     if (blob) {
 *       // Upload the recording
 *     }
 *   }
 * }
 * ```
 */
export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check if screen recording is supported
  const isSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getDisplayMedia === "function" &&
    typeof MediaRecorder !== "undefined";

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanup = useCallback(() => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    setRecordingDuration(0);
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Screen recording is not supported in this browser");
      return false;
    }

    if (isRecording) {
      return false;
    }

    setError(null);
    chunksRef.current = [];

    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false, // No audio needed for feedback recordings
      });

      streamRef.current = stream;

      // Determine the best supported MIME type
      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
        "video/mp4",
      ];

      let selectedMimeType = "";
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported video format found");
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stream ending (user stops sharing)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (isRecording) {
            // User stopped sharing, finalize recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            cleanup();
          }
        };
      }

      // Start recording
      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Update duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_RECORDING_DURATION) {
          mediaRecorderRef.current?.stop();
        }
      }, 100);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start recording";

      // Handle user cancellation gracefully
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Screen sharing was denied");
      } else {
        setError(message);
      }

      cleanup();
      return false;
    }
  }, [isSupported, isRecording, cleanup]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        setIsRecording(false);

        if (chunksRef.current.length === 0) {
          cleanup();
          resolve(null);
          return;
        }

        // Determine blob type from the recorded chunks
        const firstChunk = chunksRef.current[0];
        const mimeType = firstChunk?.type || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });

        cleanup();
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [isRecording, cleanup]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isSupported,
    error,
    clearError,
    recordingDuration,
  };
}
