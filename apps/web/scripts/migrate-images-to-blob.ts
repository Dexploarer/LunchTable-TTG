#!/usr/bin/env bun
/**
 * Migration script to upload existing images to Vercel Blob
 * Run: bun scripts/migrate-images-to-blob.ts
 */

import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

const PUBLIC_DIR = './public';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

async function findImages(dir: string): Promise<string[]> {
  const images: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subImages = await findImages(fullPath);
        images.push(...subImages);
      } else if (entry.isFile()) {
        const ext = entry.name.toLowerCase().slice(entry.name.lastIndexOf('.'));
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return images;
}

async function migrateImages() {
  console.log('🔍 Scanning for images in public directory...\n');
  
  const images = await findImages(PUBLIC_DIR);
  
  if (images.length === 0) {
    console.log('❌ No images found');
    return;
  }
  
  console.log(`📸 Found ${images.length} images:\n`);
  
  const results = [];
  
  for (const imagePath of images) {
    try {
      const relativePath = relative(PUBLIC_DIR, imagePath);
      const fileBuffer = await readFile(imagePath);
      
      console.log(`⬆️  Uploading: ${relativePath}`);
      
      // Upload to Vercel Blob with folder structure preserved
      const blob = await put(`lunchtable/${relativePath}`, fileBuffer, {
        access: 'public',
        contentType: getContentType(imagePath),
      });
      
      results.push({
        localPath: relativePath,
        blobUrl: blob.url,
        status: 'success',
      });
      
      console.log(`   ✅ ${blob.url}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to upload ${imagePath}:`, error);
      results.push({
        localPath: relativePath,
        blobUrl: null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Generate report
  console.log('\n📊 Migration Report:\n');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'failed').length}`);
  
  // Save results to JSON
  const reportPath = './blob-migration-report.json';
  await Bun.write(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Report saved to: ${reportPath}`);
  
  // Generate URL mapping for easy find/replace
  console.log('\n🔗 URL Mappings (for find/replace in codebase):\n');
  results
    .filter(r => r.status === 'success')
    .forEach(r => {
      console.log(`"/lunchtable/${r.localPath}" → "${r.blobUrl}"`);
    });
}

function getContentType(filePath: string): string {
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
  const types: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

// Check if BLOB_READ_WRITE_TOKEN is set
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN not found in environment');
  console.error('Run: vercel env pull');
  process.exit(1);
}

migrateImages().catch(console.error);
