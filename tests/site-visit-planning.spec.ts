import { test, expect } from './auth.setup';

test.describe('Site Visit Planning', () => {
  test('should create a new site visit', async ({ authenticatedPage: page }) => {
    // Navigate to site visits page
    await page.goto('/admin/visits');
    await expect(page).toHaveURL('/admin/visits');

    // Click "New Visit" or "Create Visit" button
    const createButton = page.locator('button:has-text("New Visit"), button:has-text("Create Visit"), a:has-text("New Visit")').first();
    await createButton.click();

    await page.waitForTimeout(500);

    // Fill in client name
    await page.fill('input[name="client_name"], input[placeholder*="client name" i]', 'Playwright Test Client');

    // Fill in company name
    await page.fill('input[name="company_name"], input[placeholder*="company" i]', 'Test Company Inc');

    // Set visit date (if date picker exists)
    const dateInput = page.locator('input[type="date"], input[name="visit_date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-12-15');
    }

    // Save the visit
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();

    // Wait for redirect to detail page or success
    await page.waitForTimeout(2000);

    // Should be on the visit detail page or see success
    const isOnDetailPage = page.url().includes('/admin/visits/') && !page.url().endsWith('/visits');
    expect(isOnDetailPage).toBeTruthy();
  });

  test('should add venues to site visit tour', async ({ authenticatedPage: page }) => {
    // Navigate to visits and click first visit
    await page.goto('/admin/visits');
    
    const firstVisit = page.locator('[data-visit-item], .visit-card, .visit-row, a[href*="/admin/visits/"]').first();
    await firstVisit.click();

    await page.waitForTimeout(1000);

    // Click "Add Venue" button or open venue selector
    const addVenueButton = page.locator('button:has-text("Add Venue"), button:has-text("Add Stop")').first();
    
    if (await addVenueButton.isVisible()) {
      await addVenueButton.click();
      await page.waitForTimeout(500);

      // Select a venue from the grid/list
      const venueOption = page.locator('[data-venue-option], .venue-grid-item, .venue-selector-item').first();
      await venueOption.click();

      // Wait for venue to be added to tour
      await page.waitForTimeout(1500);

      // Verify venue appears in tour agenda
      const tourStop = page.locator('[data-tour-stop], .tour-stop, .agenda-item').first();
      expect(await tourStop.isVisible()).toBeTruthy();
    }
  });

  test('should add and save pre-tour notes to venue stop', async ({ authenticatedPage: page }) => {
    // Navigate to visits and click first visit
    await page.goto('/admin/visits');
    
    const firstVisit = page.locator('[data-visit-item], .visit-card, .visit-row, a[href*="/admin/visits/"]').first();
    await firstVisit.click();

    await page.waitForTimeout(1000);

    // Find the notes textarea in the first tour stop
    const notesTextarea = page.locator('textarea[placeholder*="note" i], textarea[name*="note" i]').first();
    
    if (await notesTextarea.isVisible()) {
      // Clear and fill notes
      await notesTextarea.clear();
      await notesTextarea.fill('Pre-tour notes: Highlight the ocean view and mention recent renovations.');

      // Wait for auto-save
      await page.waitForTimeout(2000);

      // Check for "Saving..." or "Saved" indicator
      const savingIndicator = page.locator('text=/saving|saved/i');
      const hasSavingIndicator = await savingIndicator.isVisible().catch(() => false);
      
      // Reload page to verify notes persisted
      await page.reload();
      await page.waitForTimeout(1000);

      // Verify notes are still there
      const reloadedNotes = page.locator('textarea[placeholder*="note" i], textarea[name*="note" i]').first();
      const notesValue = await reloadedNotes.inputValue();
      expect(notesValue).toContain('Pre-tour notes');
    }
  });

  test('should search and filter venues in venue selector', async ({ authenticatedPage: page }) => {
    // Navigate to visit detail page
    await page.goto('/admin/visits');
    
    const firstVisit = page.locator('[data-visit-item], .visit-card, .visit-row, a[href*="/admin/visits/"]').first();
    await firstVisit.click();

    await page.waitForTimeout(1000);

    // Click add venue button
    const addVenueButton = page.locator('button:has-text("Add Venue"), button:has-text("Add Stop")').first();
    
    if (await addVenueButton.isVisible()) {
      await addVenueButton.click();
      await page.waitForTimeout(500);

      // Find search input
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.isVisible()) {
        // Type search query
        await searchInput.fill('meeting');
        await page.waitForTimeout(500);

        // Count visible venues - should be filtered
        const visibleVenues = await page.locator('[data-venue-option]:visible, .venue-grid-item:visible').count();
        
        // Should have some results but not all venues
        expect(visibleVenues).toBeGreaterThan(0);
      }
    }
  });

  test('should reorder tour stops with drag handles', async ({ authenticatedPage: page }) => {
    // Navigate to visit with multiple stops
    await page.goto('/admin/visits');
    
    const firstVisit = page.locator('[data-visit-item], .visit-card, .visit-row, a[href*="/admin/visits/"]').first();
    await firstVisit.click();

    await page.waitForTimeout(1000);

    // Check if there are multiple tour stops
    const tourStops = page.locator('[data-tour-stop], .tour-stop, .agenda-item');
    const stopCount = await tourStops.count();

    if (stopCount >= 2) {
      // Find drag handle on first stop
      const dragHandle = tourStops.first().locator('[data-drag-handle], .drag-handle, button[aria-label*="drag" i]');
      
      if (await dragHandle.isVisible()) {
        // Get initial order
        const firstStopText = await tourStops.first().textContent();
        
        // Perform drag operation (drag first stop down)
        const firstStop = await tourStops.first().boundingBox();
        const secondStop = await tourStops.nth(1).boundingBox();
        
        if (firstStop && secondStop) {
          await dragHandle.hover();
          await page.mouse.down();
          await page.mouse.move(secondStop.x + secondStop.width / 2, secondStop.y + secondStop.height / 2);
          await page.mouse.up();

          await page.waitForTimeout(1000);

          // Verify order changed
          const newFirstStopText = await tourStops.first().textContent();
          expect(newFirstStopText).not.toBe(firstStopText);
        }
      }
    }
  });
});
