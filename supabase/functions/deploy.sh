#!/bin/bash

# Deploy Edge Functions to Supabase
# Requires Supabase CLI: npm install -g supabase

set -e

echo "🚀 Deploying Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Supabase project not linked. Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Deploy process-image function
echo "📸 Deploying process-image function..."
supabase functions deploy process-image --no-verify-jwt

# Deploy process-pdf function
echo "📄 Deploying process-pdf function..."
supabase functions deploy process-pdf --no-verify-jwt

echo "✅ All functions deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set secrets if not already set:"
echo "   supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY"
echo ""
echo "2. Create Supabase Storage bucket 'media-library' with public access"
echo ""
echo "3. Test functions:"
echo "   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-image \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"mediaId\": \"uuid-here\"}'"
