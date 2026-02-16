import { test, expect } from '@playwright/test';

test('lobby page displays game categories and game grid @warning @smoke', async ({ page }) => {
  // Navigate to slots category (has game content)
  await page.goto('/games/slots');

  // Verify sidebar game categories are visible (Originals, Slots, Live Casino, etc.)
  const categoryLink = page.locator('a[href*="/games/"]').filter({ hasText: /originals|live casino|table games/i }).first();
  await expect(categoryLink).toBeVisible({ timeout: 10_000 });

  // Verify game grid has at least one game tile
  const gameTile = page.locator('a[href*="/games/all/"]').first();
  await expect(gameTile).toBeVisible({ timeout: 15_000 });
});
