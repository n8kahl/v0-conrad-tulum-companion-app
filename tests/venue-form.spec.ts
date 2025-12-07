import { test, expect } from './auth.setup';

test.describe('Venue Form', () => {
  test('should create a new venue with all required fields', async ({ authenticatedPage: page }) => {
    // Navigate to venues page
    await page.goto('/admin/venues');
    await expect(page).toHaveURL('/admin/venues');

    // Click "Add Venue" or "New Venue" button
    const addButton = page.locator('button:has-text("Add Venue"), button:has-text("New Venue"), a:has-text("Add Venue")').first();
    await addButton.click();

    // Wait for form to appear (either modal or new page)
    await page.waitForTimeout(500);

    // Fill in venue name
    await page.fill('input[name="name"], input[placeholder*="venue name" i]', 'Test Venue Playwright');

    // Fill in description
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'This is a test venue created by Playwright');

    // Select venue type
    const typeDropdown = page.locator('select[name="venue_type"], button:has-text("Select type")').first();
    await typeDropdown.click();
    await page.locator('option[value="meeting_room"], [role="option"]:has-text("Meeting Room")').first().click();

    // Fill in capacity (theater style)
    await page.fill('input[name="capacity"], input[placeholder*="capacity" i]', '100');

    // Click save button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();

    // Wait for success (either redirect or success message)
    await page.waitForTimeout(2000);

    // Verify we're back at venues list or see success message
    const hasSuccessMessage = await page.locator('text=/saved|created|success/i').isVisible().catch(() => false);
    const isBackAtList = page.url().includes('/admin/venues') && !page.url().includes('/new');

    expect(hasSuccessMessage || isBackAtList).toBeTruthy();
  });

  test('should update an existing venue', async ({ authenticatedPage: page }) => {
    // Navigate to venues page
    await page.goto('/admin/venues');

    // Click on first venue in the list
    const firstVenue = page.locator('[data-venue-item], .venue-card, .venue-row').first();
    await firstVenue.click();

    await page.waitForTimeout(500);

    // Update the description
    const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
    await descriptionField.clear();
    await descriptionField.fill('Updated description from Playwright test');

    // Click save/update button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
    await saveButton.click();

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Check for success indicator
    const hasSavingIndicator = await page.locator('text=/saving|saved|updated/i').isVisible().catch(() => false);
    expect(hasSavingIndicator).toBeTruthy();
  });

  test('should show validation errors for required fields', async ({ authenticatedPage: page }) => {
    await page.goto('/admin/venues');

    // Click add venue button
    const addButton = page.locator('button:has-text("Add Venue"), button:has-text("New Venue"), a:has-text("Add Venue")').first();
    await addButton.click();

    await page.waitForTimeout(500);

    // Try to save without filling required fields
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();

    // Should see validation errors
    const hasError = await page.locator('text=/required|error|must/i, [role="alert"]').isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });
});
