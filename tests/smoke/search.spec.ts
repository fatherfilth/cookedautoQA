import { test, expect } from '@playwright/test';

/**
 * Search test — the sidebar search input or the search dialog textbox
 * allows searching for games with as-you-type filtering.
 */
test('search returns results and user can open a game @warning @smoke', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to hydrate (client-side app)
  await page.waitForLoadState('domcontentloaded');

  // Find the search input by placeholder — it exists in the sidebar/complementary area
  // Use last() to prefer the dialog input if the search overlay is already open
  const searchInput = page.getByPlaceholder('Search games').last();
  await expect(searchInput).toBeVisible({ timeout: 10_000 });

  // Click the search input to focus it (may trigger search overlay)
  await searchInput.click();
  await searchInput.fill('blackjack');

  // Wait for results to filter — search filters as-you-type
  await page.waitForTimeout(2_000);

  // Wait for game links to appear in results
  const gameLink = page.locator('a[href*="/games/all/"]').first();
  await expect(gameLink).toBeVisible({ timeout: 10_000 });

  // Assert at least 1 result exists
  const resultCount = await page.locator('a[href*="/games/all/"]').count();
  expect(resultCount).toBeGreaterThan(0);

  // Click the first result
  await gameLink.click();

  // Assert navigation to game detail page
  await page.waitForURL('**/games/**', { timeout: 10_000 });

  // Assert content loaded on detail page
  await expect(page.getByRole('heading').first().or(page.locator('main').first())).toBeVisible();
});
