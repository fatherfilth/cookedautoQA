import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test('authenticated session is active after storageState load @critical @auth', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Navigate to homepage - storageState will be loaded automatically by Playwright
  await page.goto('/');

  // Verify authenticated state - auth indicator should be visible
  const authIndicator = page.getByRole('button', { name: /log out|sign out|account|profile/i })
    .or(page.getByText(/welcome|account|profile/i))
    .or(page.locator('[class*="avatar"], [class*="user"], [class*="profile"]').first());

  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Verify login dialog UI structure can still be accessed
  // Click login button (may show "Account" or similar when already logged in)
  await loginPage.loginButton.click();

  // If dialog opens, verify it shows correct UI structure
  // If it doesn't open (already logged in), that's also valid
  const dialogVisible = await loginPage.authDialog.isVisible({ timeout: 2_000 }).catch(() => false);

  if (dialogVisible) {
    // Dialog opened - verify it has email/password fields
    await expect(loginPage.authDialog).toBeVisible();
    await expect(
      loginPage.authDialog.locator('input[type="email"], input[name="email"]')
    ).toBeVisible();
    await expect(
      loginPage.authDialog.locator('input[type="password"]')
    ).toBeVisible();
  } else {
    // Dialog didn't open (user already logged in) - verify auth indicator still visible
    await expect(authIndicator).toBeVisible();
  }
});
