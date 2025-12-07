import { test as base, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Extend base test with authenticated user
export const test = base.extend<{
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Test user credentials - update with your test account
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    // Navigate to login page
    await page.goto('/auth/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to admin or home
    await page.waitForURL(/\/(admin|$)/, { timeout: 10000 });
    
    await use(page);
  },
});

export { expect };
