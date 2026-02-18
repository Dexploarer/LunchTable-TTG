#!/usr/bin/env bun
/**
 * Upload standardized signup avatars to Vercel Blob.
 */

import {put} from "@vercel/blob";
import {readdir, readFile, stat, writeFile} from "node:fs/promises";
import {join} from "node:path";

const AVATAR_DIR = "./public/lunchtable/avatars/signup";
const REPORT_PATH = "./signup-avatar-blob-report.json";
const BLOB_PREFIX = "lunchtable/lunchtable/avatars/signup";

type UploadResult =
  | {
      file: string;
      blobPath: string;
      blobUrl: string;
      sizeBytes: number;
      status: "success";
    }
  | {
      file: string;
      blobPath: string;
      blobUrl: null;
      sizeBytes: number;
      status: "failed";
      error: string;
    };

async function uploadSignupAvatars() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Run `vercel env pull` or export the token before upload.",
    );
  }

  const files = (await readdir(AVATAR_DIR))
    .filter((name) => /^avatar-\d{3}\.png$/.test(name))
    .sort();

  if (files.length !== 29) {
    throw new Error(`Expected 29 avatar files in ${AVATAR_DIR}, found ${files.length}.`);
  }

  const results: UploadResult[] = [];

  for (const file of files) {
    const localPath = join(AVATAR_DIR, file);
    const blobPath = `${BLOB_PREFIX}/${file}`;
    const sizeBytes = (await stat(localPath)).size;

    try {
      const body = await readFile(localPath);
      const uploaded = await put(blobPath, body, {
        access: "public",
        contentType: "image/png",
      });

      results.push({
        file,
        blobPath,
        blobUrl: uploaded.url,
        sizeBytes,
        status: "success",
      });
      console.log(`Uploaded ${file} -> ${uploaded.url}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        file,
        blobPath,
        blobUrl: null,
        sizeBytes,
        status: "failed",
        error: message,
      });
      console.error(`Failed ${file}: ${message}`);
    }
  }

  const success = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "failed");

  const report = {
    generatedAt: new Date().toISOString(),
    avatarDir: AVATAR_DIR,
    blobPrefix: BLOB_PREFIX,
    uploadedCount: success.length,
    failedCount: failed.length,
    results,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`Blob upload report: ${REPORT_PATH}`);

  if (failed.length > 0) {
    throw new Error(`Avatar upload failed for ${failed.length} files.`);
  }
}

uploadSignupAvatars().catch((error) => {
  console.error(error);
  process.exit(1);
});
