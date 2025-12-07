# Media Library System - Phase 2 Setup Guide

## Overview

Phase 2 adds processing infrastructure for uploaded media files. This includes:

- Edge Functions for image and PDF processing
- Client-side utilities for immediate feedback
- Processing queue management

## Prerequisites

1. **Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Supabase Project**

   - Project created on supabase.com
   - Project reference ID available

3. **Phase 1 Complete**
   - Database migration `007_media_library_system.sql` executed
   - Storage bucket `media-library` created

## Setup Steps

### 1. Link Supabase Project

```bash
cd v0-conrad-tulum-companion-app-1
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Create Storage Bucket

In Supabase Dashboard:

1. Go to Storage
2. Create new bucket: `media-library`
3. Set as **Private** (access controlled by RLS)
4. Add policy for authenticated uploads:

   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'media-library');

   CREATE POLICY "Public can read ready media"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'media-library');
   ```

### 3. Deploy Edge Functions

```bash
cd supabase/functions
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
supabase functions deploy process-image --no-verify-jwt
supabase functions deploy process-pdf --no-verify-jwt
```

### 4. Set Environment Secrets

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Get service role key from: Project Settings → API → service_role (secret)

### 5. Test Functions

```bash
# Test image processing
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "test-uuid"}'

# Test PDF processing
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "test-uuid"}'
```

## Environment Variables

Add to `.env.local`:

```env
# Already set from Phase 1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Optional: For direct processing (not using Edge Functions)
OPENAI_API_KEY=sk-xxx  # For voice transcription
```

## Architecture

### Current Implementation (Simplified)

```
Upload → API Route → Supabase Storage → Edge Function → Update DB
                      ↓
              Mark as "processing"
```

The Edge Functions are simplified and mark files as "ready" without full processing. This is intentional for MVP.

### Production Recommendation

For production-grade processing:

```
Upload → API Route → Supabase Storage → Queue (Inngest/BullMQ)
                      ↓                        ↓
              Mark as "processing"      Worker (Node.js)
                                              ↓
                                        Sharp/pdf-lib
                                              ↓
                                        Upload processed
                                              ↓
                                        Update DB → "ready"
```

**Recommended services:**

- **Image processing**: Cloudinary, imgix, or ImageKit
- **PDF processing**: Adobe PDF Services, PDFTron, or custom Node.js worker
- **Queue**: Inngest, Trigger.dev, or BullMQ

## Client-Side Processing

For immediate user feedback, the upload component can:

1. **Pre-process images** (optional)

   ```typescript
   import { processImageFile } from "@/lib/media/image-processing";

   const { thumbnail, preview, metadata } = await processImageFile(file);
   // Show thumbnail immediately while uploading
   ```

2. **Extract PDF metadata** (optional)

   ```typescript
   import { extractPDFMetadata } from "@/lib/media/pdf-processing";

   const metadata = await extractPDFMetadata(file);
   // Show page count immediately
   ```

## Testing the Upload Flow

1. **Create test user** (if not exists)

   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password)
   VALUES ('test@example.com', crypt('password123', gen_salt('bf')));
   ```

2. **Upload test file** via API

   ```bash
   curl -X POST http://localhost:3000/api/media/upload \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -F "file=@test-image.jpg" \
     -F "propertyId=YOUR_PROPERTY_UUID"
   ```

3. **Check processing status**

   ```bash
   curl http://localhost:3000/api/media/MEDIA_ID/status
   ```

4. **View in database**
   ```sql
   SELECT * FROM media_library WHERE id = 'MEDIA_ID';
   ```

## Troubleshooting

### Edge Function fails to deploy

- Ensure Supabase CLI is updated: `npm update -g supabase`
- Check project is linked: `supabase status`
- Verify network connectivity

### Processing never completes

- Check Edge Function logs: `supabase functions logs process-image`
- Verify secrets are set: `supabase secrets list`
- Check storage bucket exists and has correct policies

### Upload succeeds but stays in "processing"

- Edge Function may not be triggered - check API logs
- Fallback: Manually mark as ready in database
- Consider implementing retry mechanism

## Next Steps

- **Phase 3**: Build admin UI components (MediaUploadZone, MediaPicker)
- **Phase 4**: Refactor venue and asset forms
- **Phase 5**: Enhance meeting planner experience

## Production Migration Checklist

Before going live:

- [ ] Deploy proper image processing (Sharp in worker or external service)
- [ ] Deploy proper PDF processing (pdf-lib in worker or external service)
- [ ] Implement queue system for reliable processing
- [ ] Add retry logic with exponential backoff
- [ ] Set up monitoring and alerting
- [ ] Configure CDN for media delivery
- [ ] Test with large files (50MB+)
- [ ] Load test processing throughput
- [ ] Document SLA for processing time
