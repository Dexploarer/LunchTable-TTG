#!/usr/bin/env bun
/**
 * Upload soundtrack and button assets from public/ to Vercel Blob.
 * Generates soundtrack-blob-report.json with local->blob URL mappings.
 */

import { put } from "@vercel/blob";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const PUBLIC_DIR = "./public";
const SOUNDTRACK_DIR = "./public/lunchtable/soundtrack";
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac"];
const BUTTON_ASSET_PATHS = [
  "./public/lunchtable/music-button.png",
  "./public/lunchtable/music.png",
];
const REPORT_PATH = "./soundtrack-blob-report.json";

function getContentType(filePath: string): string {
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
  };
  return types[ext] ?? "application/octet-stream";
}

type UploadResult = {
  localPath: string;
  blobPath: string;
  blobUrl: string | null;
  status: "success" | "failed";
  error?: string;
};

async function getAudioFiles(): Promise<string[]> {
  const entries = await readdir(SOUNDTRACK_DIR, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = entry.name.toLowerCase().slice(entry.name.lastIndexOf("."));
    if (!AUDIO_EXTENSIONS.includes(ext)) continue;
    files.push(join(SOUNDTRACK_DIR, entry.name));
  }
  files.sort((a, b) => a.localeCompare(b, "en"));
  return files;
}

async function uploadFile(localPath: string, blobPath: string): Promise<UploadResult> {
  try {
    const fileBuffer = await readFile(localPath);
    console.log(`Uploading: ${localPath}`);

    const blob = await put(blobPath, fileBuffer, {
      access: "public",
      contentType: getContentType(localPath),
      allowOverwrite: true,
    });

    console.log(`  -> ${blob.url}\n`);
    return {
      localPath,
      blobPath,
      blobUrl: blob.url,
      status: "success",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`  x ${message}\n`);
    return {
      localPath,
      blobPath,
      blobUrl: null,
      status: "failed",
      error: message,
    };
  }
}

async function uploadAssets() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing (run `vercel env pull`).");
  }

  const soundtrackFiles = await getAudioFiles();
  const buttonFiles = BUTTON_ASSET_PATHS.slice();
  if (soundtrackFiles.length === 0) {
    console.log("No soundtrack files found.");
    return;
  }

  console.log(`Found ${soundtrackFiles.length} soundtrack files.`);
  console.log(`Found ${buttonFiles.length} button assets.\n`);

  const results: UploadResult[] = [];

  for (const filePath of soundtrackFiles) {
    const localPath = relative(PUBLIC_DIR, filePath).replaceAll("\\", "/");
    const blobPath = `lunchtable/${localPath}`;
    const result = await uploadFile(filePath, blobPath);
    results.push({
      localPath,
      blobPath,
      blobUrl: result.blobUrl,
      status: result.status,
      error: result.error,
    });
  }

  for (const filePath of buttonFiles) {
    const localPath = relative(PUBLIC_DIR, filePath).replaceAll("\\", "/");
    const blobPath = `lunchtable/${localPath}`;
    const result = await uploadFile(filePath, blobPath);
    results.push({
      localPath,
      blobPath,
      blobUrl: result.blobUrl,
      status: result.status,
      error: result.error,
    });
  }

  await Bun.write(REPORT_PATH, JSON.stringify(results, null, 2));

  const success = results.filter((r) => r.status === "success").length;
  const failed = results.length - success;

  console.log("Upload complete.");
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Report: ${REPORT_PATH}`);
}

uploadAssets().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
