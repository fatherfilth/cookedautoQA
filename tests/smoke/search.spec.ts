import { test, expect } from '@playwright/test';

/**
 * Search is mobile-only (BottomNavigationSearch component).
 * This test sets a mobile viewport to access the search feature.
 */
test('search returns results and user can open a game @warning @smoke', async ({ page }) => {
  // Set mobile viewport to access BottomNavigationSearch
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  // Look for search in bottom navigation
  const searchButton = page.getByRole('button', { name: /search/i }).or(
    page.locator('[class*="BottomNavigation"] [class*="search"], [class*="bottomNav"] [class*="search"]').first()
  ).or(
    page.locator('[class*="search"]').first()
  );

  // Click search to open search interface
  await searchButton.click();

  // Find and fill the search input
  const searchInput = page.getByRole('searchbox').or(
    page.locator('input[type="search"], input[placeholder*="search" i]').first()
  );
  await expect(searchInput).toBeVisible({ timeout: 5_000 });
  await searchInput.fill('slots');
  await searchInput.press('Enter');

  // Wait for results to appear
  const results = page.locator('.grid, [class*="result"], [class*="game"]').first();
  await expect(results).toBeVisible({ timeout: 10_000 });

  // Assert at least 1 result exists
  const resultItems = results.locator('a, [class*="aspect"]');
  const resultCount = await resultItems.count();
  expect(resultCount).toBeGreaterThan(0);

  // Click the first result
  await resultItems.first().click();

  // Assert navigation to game detail page
  await page.waitForURL('**/games/**', { timeout: 10_000 });

  // Assert content loaded on detail page
  await expect(page.getByRole('heading').first().or(page.locator('main').first())).toBeVisible();
});
