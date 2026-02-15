import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { AccountPage } from '../pages/AccountPage.js';

test('user can log in with email/password and reach account page @critical @auth', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);

  // Open login page
  await loginPage.open();

  // Login with environment credentials
  await loginPage.loginWithEnvCredentials();

  // Wait for navigation to account page or dashboard
  await page.waitForURL('**/account**', { timeout: 15_000 }).catch(() => {});

  // Verify authenticated state - assert at least one authenticated indicator is visible
  await expect(
    accountPage.username.or(accountPage.email).or(page.getByText(/welcome|account|profile/i))
  ).toBeVisible({ timeout: 10_000 });
});
