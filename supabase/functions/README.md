# Supabase Edge Functions

This directory contains Edge Functions for processing uploaded media.

## Functions

### process-image

Processes uploaded images:

- Generates thumbnails (400x300)
- Generates previews (1200x800)
- Extracts EXIF metadata
- Generates blurhash for placeholders
- Updates media_library record

### process-pdf

Processes uploaded PDFs:

- Extracts page count
- Generates page thumbnails
- Extracts text content
- Detects tables
- Classifies document type
- Updates media_library and pdf_extractions tables

## Deployment

These functions are designed to be deployed to Supabase Edge Functions.

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Project linked: `supabase link --project-ref your-project-ref`

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy process-image
supabase functions deploy process-pdf

# Set secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve process-image
supabase functions serve process-pdf
```

## Production Implementation Notes

The current implementations are simplified. For production:

### Image Processing

- Use external service (imgix, Cloudinary) or
- Deploy separate worker with sharp library or
- Use WebAssembly-based image processing in Deno

### PDF Processing

- Use Adobe PDF Services API or
- Use PDFTron cloud API or
- Deploy separate Node.js worker with pdf-lib/pdfjs or
- Use commercial PDF extraction service

### Recommended Architecture

```
Upload → API Route → Queue (BullMQ/Inngest) → Worker (Node.js with sharp/pdf-lib)
                      ↓
              Edge Function triggers processing job
```

## Testing

```bash
# Test process-image
curl -X POST https://your-project.supabase.co/functions/v1/process-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "uuid-here"}'

# Test process-pdf
curl -X POST https://your-project.supabase.co/functions/v1/process-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "uuid-here"}'
```
