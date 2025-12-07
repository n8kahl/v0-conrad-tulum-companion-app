# Conrad Tulum Site Visit Companion - AI Agent Instructions

## Project Overview

**What it is**: A mobile-first Progressive Web App (PWA) for hotel sales directors conducting site tours. Built with Next.js 16 (App Router), Supabase, shadcn/ui, and Anthropic Claude for AI-powered recap generation.

**Core user flow**: Sales directors create site visits → guide clients through venue tours → capture photos/voice notes → generate AI-powered recaps with sentiment analysis → share interactive journey links with clients.

**Tech stack**: Next.js 16 (App Router) • React 19 • TypeScript (strict) • Supabase (Auth + Database + Storage) • shadcn/ui (Radix + Tailwind v4) • Anthropic Claude • OpenAI Whisper • Framer Motion

**Key architectural decision**: This is a dual-interface app with distinctly different access patterns:

- `/admin/*` - CMS for sales directors (authenticated, full CRUD)
- `/explore/*` - Public content hub (marketing assets, venues, collections)
- `/visit/[token]` - Tokenized client tour experience (no auth required)
- `/recap/[token]` - AI-generated post-tour recap pages
- `/journey/[token]` - Interactive journey visualization post-tour

## Database Architecture

### Critical: Two-Client Pattern for Supabase

Always import the correct client based on context:

```typescript
// Server Components & Route Handlers (app/*)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // Must await!

// Client Components (with "use client" directive)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // No await, singleton pattern

// Never use in new code (legacy middleware only)
// import { updateSession } from "@/lib/supabase/proxy"
```

**Why**: Next.js 16 App Router requires different Supabase clients for server vs. browser contexts. Server client handles cookie-based auth; client singleton prevents re-initialization.

### Schema Pattern

Tables follow a **properties → visits → stops → captures** hierarchy with a centralized media system:

- `properties` - Multi-hotel support (Conrad Tulum is primary)
- `assets` - Sales PDFs, flipbooks, images, videos, virtual tours
- `collections` - Curated asset bundles (e.g., "Meetings & Incentives")
- `venues` - Physical spaces (meeting rooms, restaurants, spa)
- `site_visits` - Individual client tours with `share_token` for public access
- `visit_stops` - Ordered agenda items linking visits to venues
- `visit_captures` - Photos/voice notes captured during tours

**Media Library System (Migration 007)**:

- `media_library` - Central repository for ALL files with processing pipeline
- `venue_media` - Junction table linking media to venues with context (hero, gallery, floorplan, etc.)
- `asset_media` - Junction table linking media to sales assets (versioned, language-specific)
- `pdf_extractions` - Extracted pages, text, and tables from PDFs
- `media_collections` - Grouped media for easy access

**Migration workflow**: SQL files in `scripts/*.sql` are hand-run in Supabase Studio. Script `007_media_library_system.sql` includes automated migration of existing URL-based media.

## Component Patterns

### Server vs. Client Component Strategy

**Default to Server Components**. Only add `"use client"` when you need:

- React hooks (`useState`, `useEffect`, `useRef`)
- Browser APIs (camera, microphone, geolocation)
- Event handlers on interactive elements
- Context consumers

**Pattern for auth-protected pages**:

```typescript
// app/admin/assets/page.tsx (Server Component)
export default async function AssetsPage() {
  const supabase = await createClient();
  const { data: assets } = await supabase.from("assets").select("*");
  return <AssetGrid assets={assets} />; // Pass data down
}
```

**Pattern for client interactivity**:

```typescript
// components/admin/asset-grid.tsx (Client Component)
"use client";
export function AssetGrid({ assets }: { assets: Asset[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  // Client-side state and interactions
}
```

### shadcn/ui and Styling

- Use `cn()` utility from `@/lib/utils` for conditional classes: `cn("base-class", condition && "conditional-class")`
- All UI components in `components/ui/*` follow shadcn/ui patterns (Radix + Tailwind)
- Custom button variants use `cva` from `class-variance-authority`
- Brand colors: Primary gold `#C4A052`, Secondary dark `#2D2D2D`
- Mobile-first: Always design for touch (min 44px tap targets)

### Branding Configuration

**All branding elements can be managed through the admin settings page** (`/admin/settings`). Branding is stored in the database (`properties.branding_config`) and centralized in code at `lib/branding/config.ts`.

```typescript
import { getBrandingConfig } from "@/lib/branding/config";

const branding = getBrandingConfig();
// Access: branding.property.name, branding.colors.primary, branding.images.welcomeBackground
```

**Admin UI**: Navigate to Settings → Branding Configuration to edit:

- Property info (name, tagline, description)
- Colors (primary, secondary, theme) with live preview
- Images (welcome, auth, headers, maps)
- Contact info (email, phone, address)
- Social media (website, Instagram, Facebook)

**API**: Use `/api/branding` GET/POST endpoints for programmatic access. See `docs/BRANDING_MANAGEMENT.md` for details. Database migration: `scripts/009_branding_configuration.sql`

### TypeScript Props Pattern

Always define interfaces for component props:

```typescript
interface CaptureToolbarProps {
  visitStopId: string
  venueId: string
  venueName: string
  onCapture: (capture: CaptureResult) => void
  disabled?: boolean
}

export function CaptureToolbar({ visitStopId, venueId, ... }: CaptureToolbarProps) {
  // Implementation
}
```

## Feature-Specific Patterns

### Media Capture (Phase 1 Implementation)

Custom hooks in `lib/hooks/*` provide browser API access:

- `useCamera()` - Camera with front/back switching, returns `capturePhoto()` method
- `useAudioRecorder()` - MediaRecorder with waveform visualization
- `useGeolocation()` - GPS coordinates (with permission handling)

**Always handle permissions gracefully**. Show clear error states when denied.

### AI Recap Generation

Route: `app/api/recaps/generate/route.ts` (POST)

Uses Anthropic Claude to analyze:

- Voice note transcripts (from Whisper API)
- Visit stop metadata (time spent, favorites, reactions)
- Client annotations (questions, concerns, emoji reactions)

Returns structured JSON with sentiment analysis per venue. See `GeneratedRecap` interface in route handler.

### Tokenized Sharing

Pattern for public share links:

1. Generate unique `share_token` (UUID) on visit creation
2. Public routes at `/visit/[token]` and `/recap/[token]`
3. No auth required - token is the authorization
4. Use `notFound()` from `next/navigation` if token invalid

```typescript
const { data: visit } = await supabase
  .from("site_visits")
  .select("*")
  .eq("share_token", token)
  .single();

if (!visit) notFound();
```

### Offline Support

Service Worker at `public/sw.js` implements:

- Network-first for dynamic content
- Cache-first for static assets
- Stale-while-revalidate for images

When building offline features, queue actions locally and sync when online.

## Development Workflow

### Running the App

```bash
pnpm dev       # Start dev server (localhost:3000) with Turbopack
pnpm build     # Production build with type checking
pnpm lint      # ESLint validation
pnpm start     # Production server
```

**Before committing**: Always run `pnpm build` to catch TypeScript errors. This project uses strict mode (`strict: true` in `tsconfig.json`).

### Database Changes

1. Write SQL in `scripts/*.sql` following naming pattern `00X_description.sql`
2. Test locally in Supabase Studio SQL Editor (SQL Editor tab)
3. Document in `docs/PHASE*_*.md` if part of major feature
4. Update TypeScript types in `lib/supabase/types.ts` manually (no auto-generation)
5. **Never modify `supabase/functions/` TypeScript config** - excluded from main project

### Supabase Edge Functions (Phase 2)

Located in `supabase/functions/` with separate TypeScript config:

- `process-image/` - Image metadata extraction, blurhash generation
- `process-pdf/` - PDF text extraction, document classification
- Deploy via `supabase/functions/deploy.sh` (requires Supabase CLI)
- Triggered asynchronously from `/api/media/upload` route

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
OPENAI_API_KEY=sk-xxx  # For voice transcription (optional)
ANTHROPIC_API_KEY=sk-xxx  # For AI recap generation
```

## Common Gotchas

1. **Dynamic Routes**: Always `await params` in Next.js 16: `const { id } = await params`
2. **Image Optimization Disabled**: `next.config.mjs` has `unoptimized: true` for v0.app deployment
3. **Path Aliases**: Use `@/*` for all imports (maps to project root via `tsconfig.json`)
4. **Middleware**: Runs on all routes except static assets (see `config.matcher`). Handles Supabase session refresh via `updateSession()` from `@/lib/supabase/proxy`.
5. **Array Columns**: Supabase arrays use PostgreSQL syntax: `asset_ids UUID[]`. In queries, use `.contains()` or `.overlaps()`.
6. **JSONB Columns**: Use `->` for access in queries: `.select("capacities->theater")`
7. **Media Library**: Use junction tables (`venue_media`, `asset_media`) to link media, not direct foreign keys. Media files are stored in Supabase Storage bucket `media-library`.
8. **File Uploads**: Always use `/api/media/upload` route, not direct storage access. Processing happens asynchronously via Edge Functions.
9. **Turbopack**: Enabled by default in dev mode (Next.js 16). `turbopack.root` set to `__dirname` in config.
10. **React 19**: Uses new JSX runtime (`jsx: "react-jsx"` in tsconfig). No need to import React in components.

## Testing Checklist for New Features

- [ ] Works on iOS Safari (primary target)
- [ ] Works on Android Chrome
- [ ] Handles offline gracefully
- [ ] Proper loading states (no layout shift)
- [ ] Error boundaries for failures
- [ ] Responsive on 320px to 2560px widths
- [ ] No TypeScript errors in `pnpm build`
- [ ] Proper Server/Client component separation

## Files to Reference

- Architecture decisions: `docs/PHASE1_IMPLEMENTATION.md`, `docs/PHASE2_COMPLETE.md`
- Branding system: `lib/branding/config.ts`, `docs/BRANDING_CONFIGURATION.md` (centralized property branding)
- Database schema: `scripts/001_create_tables.sql` (base tables)
- Media library system: `scripts/007_media_library_system.sql` (migration with automated data migration)
- Auth patterns: `lib/supabase/{client,server,proxy}.ts` (critical two-client pattern)
- TypeScript types: `lib/supabase/types.ts` (includes media system types)
- Media processing: `lib/media/{processing,image-processing,pdf-processing}.ts`
- Media API routes: `app/api/media/*` (upload, webhook, retry endpoints)
- AI recap generation: `app/api/recaps/generate/route.ts`
- UI components: `components/ui/*` (shadcn/ui with Radix primitives)
- Custom hooks: `lib/hooks/*` (camera, audio, geolocation, offline)
- Tour mode (complex): `components/client/tour-mode.tsx` (1200+ lines, stateful tour experience)

## When in Doubt

- Prioritize **mobile experience** over desktop (iOS Safari is primary target)
- Follow **Next.js App Router** patterns (no Pages Router)
- Keep Server Components default, explicit `"use client"` only when needed
- Use **Supabase RLS** for security (not application-level checks)
- Match **existing component patterns** before inventing new ones
- Check `docs/` for feature implementation details before building
