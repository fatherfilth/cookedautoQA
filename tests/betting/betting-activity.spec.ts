import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scroll to bottom of page where betting activity component lives
 */
async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * BET-01: All Bets tab shows betting entries
 * Validates that the default "All Bets" tab displays live betting activity at the bottom of the page.
 */
test('All Bets tab shows betting entries @warning @betting', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');

  // Scroll to bottom where betting activity component lives
  await scrollToBottom(page);

  // Locate the "All Bets" tab (should be visible/active by default)
  const allBetsTab = page.getByRole('tab', { name: /all bets/i })
    .or(page.getByText(/all bets/i).first());
  await expect(allBetsTab).toBeVisible({ timeout: 15_000 });

  // Assert at least one betting entry row is visible
  // Using broad selectors since DOM structure is unknown: table rows or div-based rows
  const bettingEntry = page.locator('table tbody tr, [class*="bet"] [class*="row"], [class*="activity"] [class*="row"]').first();
  await expect(bettingEntry).toBeVisible({ timeout: 15_000 });

  // Assert the entry has text content (not empty placeholder)
  const entryText = await bettingEntry.textContent();
  expect(entryText).toBeTruthy();
  expect(entryText!.trim().length).toBeGreaterThan(0);
});

/**
 * BET-02: High Rollers tab shows betting entries
 * Validates that clicking the "High Rollers" tab shows different betting activity entries.
 */
test('High Rollers tab shows betting entries @warning @betting', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');

  // Scroll to bottom of page
  await scrollToBottom(page);

  // Locate the "High Rollers" tab
  const highRollersTab = page.getByRole('tab', { name: /high rollers/i })
    .or(page.getByText(/high rollers/i).first());
  await expect(highRollersTab).toBeVisible({ timeout: 15_000 });

  // Click the High Rollers tab
  await highRollersTab.click();

  // Wait for tab content to update
  // Using waitForTimeout for tab switch animation/re-render
  await page.waitForTimeout(1000);

  // Assert at least one betting entry row is visible in the High Rollers tab
  const bettingEntry = page.locator('table tbody tr, [class*="bet"] [class*="row"], [class*="activity"] [class*="row"]').first();
  await expect(bettingEntry).toBeVisible({ timeout: 15_000 });

  // Assert the entry has text content
  const entryText = await bettingEntry.textContent();
  expect(entryText).toBeTruthy();
  expect(entryText!.trim().length).toBeGreaterThan(0);
});
