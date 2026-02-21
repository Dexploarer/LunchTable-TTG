#!/usr/bin/env bun
/**
 * Standardize signup avatar source files into canonical names:
 * public/lunchtable/avatars/signup/avatar-001.png ... avatar-029.png
 */

import {createHash} from "node:crypto";
import {access, copyFile, mkdir, readdir, readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";

const SOURCE_DIR = "/Users/home/Downloads";
const DEST_DIR = "./public/lunchtable/avatars/signup";
const REPORT_PATH = "./signup-avatar-standardization-report.json";

const SOURCE_BASENAMES = [
  "Blue_Slime_Jello.png",
  "Brain_Food_Deluxe.png",
  "Brain_Meatloaf_Classic.png",
  "Cyber_Sushi.png",
  "Golden_Carrot.png",
  "Green_Bean_Day.png",
  "Holiday_Turkey.png",
  "Mashed_Potato_Variant.png",
  "Mystery_Meatloaf.png",
  "Stardust_Soup.png",
  "nft-0mfi8voqd.png",
  "nft-9cb7xh9nq.png",
  "nft-a6261fbh6.png",
  "nft-avwduoupe.png",
  "nft-d94d3pfu9.png",
  "nft-dgbq0i9ts.png",
  "nft-eq4wx5wpy.png",
  "nft-h85fokt5l.png",
  "nft-jhhjtso0s.png",
  "nft-jxhbi49p3.png",
  "nft-keb8n46jr.png",
  "nft-mrh14f547.png",
  "nft-ndfcpf500.png",
  "nft-ol9waom6y.png",
  "nft-qp5p677xr.png",
  "nft-tl60ox7zy.png",
  "nft-un4rv6jvf.png",
  "nft-xdhj1sux2.png",
  "nft-ztpct9taj.png",
  "Golden_Carrot (1).png",
  "nft-9cb7xh9nq (1).png",
  "nft-9cb7xh9nq (2).png",
  "nft-dgbq0i9ts (1).png",
  "nft-tl60ox7zy (1).png",
] as const;

const CANONICAL_MAPPING = [
  {target: "avatar-001.png", source: "Blue_Slime_Jello.png"},
  {target: "avatar-002.png", source: "Brain_Food_Deluxe.png"},
  {target: "avatar-003.png", source: "Brain_Meatloaf_Classic.png"},
  {target: "avatar-004.png", source: "Cyber_Sushi.png"},
  {target: "avatar-005.png", source: "Golden_Carrot.png"},
  {target: "avatar-006.png", source: "Green_Bean_Day.png"},
  {target: "avatar-007.png", source: "Holiday_Turkey.png"},
  {target: "avatar-008.png", source: "Mashed_Potato_Variant.png"},
  {target: "avatar-009.png", source: "Mystery_Meatloaf.png"},
  {target: "avatar-010.png", source: "Stardust_Soup.png"},
  {target: "avatar-011.png", source: "nft-0mfi8voqd.png"},
  {target: "avatar-012.png", source: "nft-9cb7xh9nq.png"},
  {target: "avatar-013.png", source: "nft-a6261fbh6.png"},
  {target: "avatar-014.png", source: "nft-avwduoupe.png"},
  {target: "avatar-015.png", source: "nft-d94d3pfu9.png"},
  {target: "avatar-016.png", source: "nft-dgbq0i9ts.png"},
  {target: "avatar-017.png", source: "nft-eq4wx5wpy.png"},
  {target: "avatar-018.png", source: "nft-h85fokt5l.png"},
  {target: "avatar-019.png", source: "nft-jhhjtso0s.png"},
  {target: "avatar-020.png", source: "nft-jxhbi49p3.png"},
  {target: "avatar-021.png", source: "nft-keb8n46jr.png"},
  {target: "avatar-022.png", source: "nft-mrh14f547.png"},
  {target: "avatar-023.png", source: "nft-ndfcpf500.png"},
  {target: "avatar-024.png", source: "nft-ol9waom6y.png"},
  {target: "avatar-025.png", source: "nft-qp5p677xr.png"},
  {target: "avatar-026.png", source: "nft-tl60ox7zy.png"},
  {target: "avatar-027.png", source: "nft-un4rv6jvf.png"},
  {target: "avatar-028.png", source: "nft-xdhj1sux2.png"},
  {target: "avatar-029.png", source: "nft-ztpct9taj.png"},
] as const;

const hashBuffer = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex");

async function ensureFilesExist() {
  const missing: string[] = [];
  for (const basename of SOURCE_BASENAMES) {
    const path = join(SOURCE_DIR, basename);
    try {
      await access(path);
    } catch {
      missing.push(path);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing source avatar files:\n${missing.join("\n")}`);
  }
}

async function scanHashes() {
  const fileHashes = new Map<string, string>();
  const hashGroups = new Map<string, string[]>();

  for (const basename of SOURCE_BASENAMES) {
    const buffer = await readFile(join(SOURCE_DIR, basename));
    const hash = hashBuffer(buffer);
    fileHashes.set(basename, hash);
    hashGroups.set(hash, [...(hashGroups.get(hash) ?? []), basename]);
  }

  const duplicateGroups = [...hashGroups.entries()]
    .filter(([, basenames]) => basenames.length > 1)
    .map(([hash, basenames]) => ({hash, basenames}))
    .sort((a, b) => b.basenames.length - a.basenames.length);

  return {
    fileHashes,
    uniqueHashCount: hashGroups.size,
    duplicateGroups,
  };
}

async function clearPreviousTargets() {
  await mkdir(DEST_DIR, {recursive: true});
  const existing = await readdir(DEST_DIR);
  const previousTargets = existing.filter((name) => /^avatar-\d{3}\.png$/.test(name));
  for (const target of previousTargets) {
    await rm(join(DEST_DIR, target), {force: true});
  }
}

async function standardize() {
  await ensureFilesExist();
  const {fileHashes, uniqueHashCount, duplicateGroups} = await scanHashes();
  await clearPreviousTargets();

  const copied: Array<{
    target: string;
    source: string;
    sourceHash: string;
    relativePath: string;
  }> = [];

  for (const {target, source} of CANONICAL_MAPPING) {
    const sourcePath = join(SOURCE_DIR, source);
    const targetPath = join(DEST_DIR, target);
    await copyFile(sourcePath, targetPath);
    copied.push({
      target,
      source,
      sourceHash: fileHashes.get(source) ?? "unknown",
      relativePath: `lunchtable/avatars/signup/${target}`,
    });
  }

  const written = (await readdir(DEST_DIR))
    .filter((name) => /^avatar-\d{3}\.png$/.test(name))
    .sort();

  if (written.length !== CANONICAL_MAPPING.length) {
    throw new Error(
      `Expected ${CANONICAL_MAPPING.length} standardized files, found ${written.length}.`,
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceDir: SOURCE_DIR,
    destinationDir: DEST_DIR,
    sourceFileCount: SOURCE_BASENAMES.length,
    uniqueHashCount,
    duplicateGroups,
    copiedCount: copied.length,
    copied,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("Signup avatars standardized.");
  console.log(`- Source files scanned: ${SOURCE_BASENAMES.length}`);
  console.log(`- Unique hashes: ${uniqueHashCount}`);
  console.log(`- Standardized outputs: ${written.length}`);
  console.log(`- Destination: ${DEST_DIR}`);
  console.log(`- Report: ${REPORT_PATH}`);
}

standardize().catch((error) => {
  console.error(error);
  process.exit(1);
});
