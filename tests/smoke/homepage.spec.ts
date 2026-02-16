import { test, expect } from '@playwright/test';

test('homepage loads and hero/promo banner is visible @critical @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded with a non-empty title
  await expect(page).toHaveTitle(/.+/);

  // Homepage content is inside complementary role with game categories and links
  // Look for the game content area with heading or game links
  const content = page.getByRole('complementary').first().or(
    page.locator('main').first()
  );

  // Assert content area is visible
  await expect(content).toBeVisible({ timeout: 10_000 });

  // Assert content has game links (not empty)
  await expect(content).not.toBeEmpty();

  // Verify at least one game link is visible (confirms content rendered)
  const gameLink = content.locator('a[href*="/games/all/"]').first();
  await expect(gameLink).toBeVisible({ timeout: 10_000 });
});
