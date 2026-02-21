/**
 * Vercel Blob Storage Utilities
 *
 * Provides helpers for uploading and serving assets from Vercel Blob storage.
 * All static assets (images, videos) should be stored in Blob for better
 * performance and CDN distribution.
 */

import { type PutBlobResult, del, list, put } from "@vercel/blob";

// =============================================================================
// Constants
// =============================================================================

/**
 * Base URL for blob assets - set after initial upload
 * Format: https://<store-id>.public.blob.vercel-storage.com
 */
const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "";

/**
 * Asset path mappings from old public paths to blob paths
 * This allows gradual migration without breaking existing code
 */
const ASSET_PATH_MAP: Record<string, string> = {
  // Logos
  "/assets/logo-zine.png": "logo-zine.png",
  "/assets/logo-icon.png": "logo-icon.png",

  // Backgrounds
  "/assets/backgrounds/auth-bg.png": "backgrounds/auth-bg.png",
  "/assets/backgrounds/profile-bg.png": "backgrounds/profile-bg.png",
  "/assets/backgrounds/social-bg.png": "backgrounds/social-bg.png",
  "/assets/backgrounds/story-bg.png": "backgrounds/story-bg.png",
  "/assets/backgrounds/game_arena_background.png": "backgrounds/game_arena_background.png",
  "/assets/backgrounds/shop-bg.png": "backgrounds/shop-bg.png",
  "/assets/backgrounds/quests-bg.png": "backgrounds/quests-bg.png",
  "/assets/backgrounds/decks-bg.png": "backgrounds/decks-bg.png",
  "/assets/backgrounds/collection-bg.png": "backgrounds/collection-bg.png",
  "/assets/dashboard-bg.jpg": "dashboard-bg.jpg",

  // Textures - upgraded to seamless 1024px brand versions
  "/assets/textures/crumpled-paper.png": "brand/textures/crumpled-paper.png",
  "/assets/textures/photocopy-noise.png": "brand/textures/photocopy-noise.png",
  "/assets/textures/arcane-stone.png": "brand/textures/arcane-stone-seamless-1024.png",
  "/assets/textures/gold-metal.png": "brand/textures/gold-metal-seamless-1024.png",
  "/assets/overlays/halftone-dots.png": "brand/textures/halftone-dots.png",
  "/assets/overlays/comic-noise.png": "brand/textures/comic-noise.png",
  "/assets/overlays/paper-texture.png": "brand/textures/paper-texture.png",
  "/assets/overlays/vignette.png": "brand/textures/vignette.png",
  "/assets/zine-border-frame.png": "zine-border-frame.png",

  // UI Elements - using high-quality alpha PNG versions from brand directory
  "/assets/ui/fantasy_gold_metal.png": "ui/fantasy_gold_metal.png",
  "/assets/ui/fantasy_panel_bg.png": "brand/ui/fantasy_panel_bg.alpha.png",
  "/assets/ui/fantasy_wood_btn.png": "brand/ui/fantasy_wood_btn.alpha.png",
  "/assets/ui/button-bg.png": "brand/ui/button-bg.alpha.png",
  "/assets/ui/buttons_fantasy.png": "brand/ui/buttons_fantasy.alpha.png",
  "/assets/ui/corner_ornament.png": "brand/ui/corner_ornament.alpha.png",
  "/assets/ui/header_banner.png": "brand/ui/header_banner.alpha.png",
  "/assets/ui/panel_grimoire.png": "brand/ui/panel_grimoire.alpha.png",
  "/assets/card-bg.svg": "card-bg.svg",

  // Shop
  "/assets/shop/foil-pack-generic.png": "shop/foil-pack-generic.png",
  "/assets/shop/cardboard-box.png": "shop/cardboard-box.png",
  "/assets/shop/brown-bag-pack.png": "shop/brown-bag-pack.png",
  "/assets/shop/foil-booster-pack.png": "shop/foil-booster-pack.png",
  "/assets/shop/packopening.mp4": "shop/packopening.mp4",

  // Story characters - LunchTable TCG archetypes
  "/assets/story/dropout.png": "story/dropout.png",
  "/assets/story/prep.png": "story/prep.png",
  "/assets/story/geek.png": "story/geek.png",
  "/assets/story/freak.png": "story/freak.png",
  "/assets/story/nerd.png": "story/nerd.png",
  "/assets/story/goodie_two_shoes.png": "story/goodie_two_shoes.png",

  // Social media assets (for external marketing use)
  "/brand/social/og-1200x630.png": "brand/social/og-1200x630.png",
  "/brand/social/reels-1080x1920.png": "brand/social/reels-1080x1920.png",
  "/brand/social/square-1024.png": "brand/social/square-1024.png",

  // Hero backgrounds
  "/brand/backgrounds/ltcg-hero-1536x1024.branded.png":
    "brand/backgrounds/ltcg-hero-1536x1024.branded.png",
  "/brand/backgrounds/ltcg-vertical-1024x1536.png": "brand/backgrounds/ltcg-vertical-1024x1536.png",
};

// =============================================================================
// Asset URL Helper
// =============================================================================

/**
 * Get the URL for an asset, using Blob storage if available, falling back to public path.
 *
 * @param publicPath - The original public path (e.g., "/assets/logo-main.png")
 * @returns The blob URL if configured, otherwise the original public path
 *
 * @example
 * // With blob configured:
 * getAssetUrl("/assets/logo-main.png")
 * // Returns: "https://xxx.public.blob.vercel-storage.com/logos/logo-main.png"
 *
 * // Without blob configured (fallback):
 * getAssetUrl("/assets/logo-main.png")
 * // Returns: "/assets/logo-main.png"
 */
export function getAssetUrl(publicPath: string): string {
  // If no blob base URL configured, return original path
  if (!BLOB_BASE_URL) {
    return publicPath;
  }

  // Check if we have a mapping for this path
  const blobPath = ASSET_PATH_MAP[publicPath];
  if (blobPath) {
    return `${BLOB_BASE_URL}/${blobPath}`;
  }

  // For dynamic story assets, try to construct the blob path
  if (publicPath.startsWith("/assets/story/")) {
    const filename = publicPath.replace("/assets/story/", "");
    return `${BLOB_BASE_URL}/story/${filename}`;
  }

  // Fallback to original path
  return publicPath;
}

/**
 * Get blob URL directly from blob path
 */
export function getBlobUrl(blobPath: string): string {
  if (!BLOB_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BLOB_BASE_URL is not configured");
  }
  return `${BLOB_BASE_URL}/${blobPath}`;
}

// =============================================================================
// Upload Utilities (Server-side only)
// =============================================================================

/**
 * Upload a file to Vercel Blob storage
 * This should only be called from server-side code (API routes, server actions)
 *
 * @param file - The file buffer or readable stream
 * @param pathname - The path to store the file at (e.g., "logos/logo-main.png")
 * @param options - Additional options
 * @returns The blob result with URL
 */
export async function uploadToBlob(
  file: Buffer | ReadableStream,
  pathname: string,
  options?: {
    contentType?: string;
    access?: "public";
  }
): Promise<PutBlobResult> {
  const result = await put(pathname, file, {
    access: options?.access || "public",
    contentType: options?.contentType,
  });

  return result;
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * List files in Vercel Blob storage
 */
export async function listBlobs(options?: { prefix?: string; limit?: number }) {
  const result = await list({
    prefix: options?.prefix,
    limit: options?.limit,
  });

  return result;
}

// =============================================================================
// Content Type Helpers
// =============================================================================

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

/**
 * Get content type from file extension
 */
export function getContentType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || "application/octet-stream";
}
