# Playwright Testing Setup

## Prerequisites

1. **Install dependencies** (already done):

   ```bash
   pnpm install
   ```

2. **Set up test environment variables**:
   Copy `.env.test.example` to `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=testpassword123
   ```

3. **Create test user in Supabase**:
   - Go to Authentication → Users in Supabase Studio
   - Create a new user with the credentials from `.env.local`
   - Grant admin access if needed

## Running Tests

### Run all tests (headless):

```bash
pnpm test
```

### Run tests with UI (see what's happening):

```bash
pnpm test:ui
```

### Run tests in headed mode (see browser):

```bash
pnpm test:headed
```

### Run tests in debug mode (step through):

```bash
pnpm test:debug
```

## Test Coverage

### Venue Form Tests (`tests/venue-form.spec.ts`)

- ✅ Create new venue with required fields
- ✅ Update existing venue
- ✅ Validation for required fields

### Site Visit Planning Tests (`tests/site-visit-planning.spec.ts`)

- ✅ Create new site visit
- ✅ Add venues to tour agenda
- ✅ Add and auto-save pre-tour notes
- ✅ Search and filter venues
- ✅ Reorder tour stops with drag handles

### Media Upload Tests (`tests/media-upload.spec.ts`)

- ✅ Upload venue images
- ✅ Upload asset thumbnails
- ✅ Upload progress indicators
- ✅ Error handling for invalid files

## Troubleshooting

### Tests failing on login

- Verify test user exists in Supabase
- Check environment variables are loaded
- Ensure user has proper permissions

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running (`pnpm dev`)
- Verify network connectivity to Supabase

### Element not found errors

- Check if selectors match current UI
- Run tests in UI mode to see what's happening
- Update selectors in test files if UI changed

## Next Steps

After identifying failing tests:

1. Note which buttons/saves aren't working
2. Fix the underlying component issues
3. Re-run tests to verify fixes
4. Add more test coverage as needed
