import { test, expect } from '@playwright/test';

test('authenticated session persists across page navigation @critical @auth', async ({ page }) => {
  // Navigate to homepage - storageState will be loaded automatically by Playwright
  await page.goto('/');

  // Verify authenticated state — wallet button in nav indicates logged in
  const authIndicator = page.getByRole('button', { name: /wallet/i }).first();
  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Navigate away to slots page
  await page.goto('/games/slots');
  await expect(page.locator('a[href*="/games/all/"]').first()).toBeVisible({ timeout: 10_000 });

  // Navigate back to homepage
  await page.goto('/');

  // Assert session persists — user still logged in (wallet button still visible)
  await expect(authIndicator).toBeVisible({ timeout: 10_000 });
});
