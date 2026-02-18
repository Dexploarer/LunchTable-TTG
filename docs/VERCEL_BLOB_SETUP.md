# Vercel Blob Setup for LunchTable TTG

## Overview

This project uses **Vercel Blob** for image storage and serving. Static images are served from a public Blob base URL
defined in `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/lib/blobUrls.ts`.

## Setup Instructions

### 1. Connect Vercel Blob to Your Project

```bash
# In your terminal, run:
vercel link

# Then create a Blob store:
vercel storage add blob

# Or go to Vercel Dashboard:
# 1. Go to your project on vercel.com
# 2. Click "Storage" tab
# 3. Click "Connect Database"
# 4. Select "Blob" and create a new store
# 5. Name it: "lunchtable-images"
```

### 2. Pull Environment Variables

```bash
# This will add BLOB_READ_WRITE_TOKEN to your .env.local
vercel env pull
```

### 3. Verify Installation

The `@vercel/blob` package is already installed:

```bash
bun add @vercel/blob
```

## API Route

**File:** `/Users/home/untitled folder 2/LunchTable-TTG/api/blob-upload.ts`

This Vercel Function handles server-side image uploads:
- Validates file types (jpg, png, webp, gif, svg)
- Uploads to Vercel Blob
- Returns public URL

Note: the repo does not ship a full end-user asset uploader UI yet. For now, upload assets via the Vercel dashboard
or call the route from admin tooling.

## Image URLs

Static image URLs are resolved via:

- `blob("path.png")` helper
- exported constants in `/Users/home/untitled folder 2/LunchTable-TTG/apps/web/src/lib/blobUrls.ts`

## File Structure

```
api/
└── blob-upload.ts              # Vercel Function for uploads

apps/web/src/lib/
└── blobUrls.ts                 # Centralized image URL helpers/constants
```

## Environment Variables

Add to `.env.local`:

```
# Vercel Blob (auto-generated when connecting storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
```

**⚠️ Never commit this token to git!**

## Limits

- **Server uploads:** 4.5MB per file
- **Client uploads:** Available for larger files (more complex setup)
- **Storage:** Based on your Vercel plan

## Next Steps

1. Run `vercel link` to connect your project
2. Run `vercel storage add blob` to create storage
3. Run `vercel env pull` to get the token
4. Test upload with the ImageUpload component
5. Run migration script to move existing images
6. Update image URLs in your codebase

## Support

- [Vercel Blob Docs](https://vercel.com/docs/vercel-blob)
- [Server Uploads Guide](https://vercel.com/docs/vercel-blob/server-upload)
- [Client Uploads Guide](https://vercel.com/docs/vercel-blob/client-upload)
