import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test('user can log in with email/password via auth dialog @critical @auth', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Open auth dialog via URL param
  await loginPage.open();

  // Verify auth dialog appeared
  await expect(loginPage.authDialog).toBeVisible();

  // Login with environment credentials
  await loginPage.loginWithEnvCredentials();

  // Wait for dialog to close or page to redirect after successful login
  // Auth dialog should dismiss on success; wait for either:
  // - Dialog to disappear
  // - URL to change (redirect to account/dashboard/home)
  // - Authenticated UI indicator to appear
  await Promise.race([
    loginPage.authDialog.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {}),
    page.waitForURL('**/account**', { timeout: 15_000 }).catch(() => {}),
    page.waitForURL('**/', { timeout: 15_000 }).catch(() => {}),
  ]);

  // Verify authenticated state — look for any auth indicator
  await expect(
    page.getByRole('button', { name: /log out|sign out|account|profile/i }).or(
      page.getByText(/welcome|account|profile/i)
    ).or(
      page.locator('[class*="avatar"], [class*="user"], [class*="profile"]').first()
    )
  ).toBeVisible({ timeout: 10_000 });
});
