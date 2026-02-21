/**
 * Feedback Media Upload Helper
 *
 * Handles uploading screenshots and recordings to Vercel Blob storage
 * via the /api/feedback/upload endpoint.
 */

import { upload } from "@vercel/blob/client";

interface UploadOptions {
  feedbackType: "bug" | "feature";
  mediaType: "screenshot" | "recording";
}

interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Upload a feedback media file (screenshot or recording) to Vercel Blob.
 *
 * @param file - The file blob to upload
 * @param filename - The filename for the upload
 * @param options - Upload options including feedback type and media type
 * @returns The uploaded file URL and pathname
 */
export async function uploadFeedbackMedia(
  file: Blob,
  _filename: string,
  options: UploadOptions
): Promise<UploadResult> {
  const { feedbackType, mediaType } = options;

  // Generate a unique filename with timestamp
  const timestamp = Date.now();
  const extension = mediaType === "screenshot" ? "png" : "webm";
  const uniqueFilename = `feedback/${feedbackType}/${mediaType}-${timestamp}.${extension}`;

  try {
    const blob = await upload(uniqueFilename, file, {
      access: "public",
      handleUploadUrl: "/api/feedback/upload",
      clientPayload: JSON.stringify({
        feedbackType,
        mediaType,
      }),
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error("Feedback upload error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to upload file");
  }
}

/**
 * Upload a screenshot blob to Vercel Blob.
 *
 * @param screenshot - The screenshot blob
 * @param feedbackType - Whether this is for a bug or feature request
 * @returns The uploaded screenshot URL
 */
export async function uploadScreenshot(
  screenshot: Blob,
  feedbackType: "bug" | "feature"
): Promise<string> {
  const result = await uploadFeedbackMedia(screenshot, `screenshot-${Date.now()}.png`, {
    feedbackType,
    mediaType: "screenshot",
  });
  return result.url;
}

/**
 * Upload a screen recording blob to Vercel Blob.
 *
 * @param recording - The recording blob
 * @param feedbackType - Whether this is for a bug or feature request
 * @returns The uploaded recording URL
 */
export async function uploadRecording(
  recording: Blob,
  feedbackType: "bug" | "feature"
): Promise<string> {
  const result = await uploadFeedbackMedia(recording, `recording-${Date.now()}.webm`, {
    feedbackType,
    mediaType: "recording",
  });
  return result.url;
}
