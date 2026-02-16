import { test, expect } from '@playwright/test';

test('authenticated session is active after storageState load @critical @auth', async ({ page }) => {
  // Navigate to homepage - storageState will be loaded automatically by Playwright
  await page.goto('/');

  // Verify authenticated state — wallet button in nav indicates logged in
  const authIndicator = page.getByRole('button', { name: /wallet/i }).first();
  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Verify Login button is NOT visible (replaced by wallet when authenticated)
  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).not.toBeVisible({ timeout: 2_000 });
});
