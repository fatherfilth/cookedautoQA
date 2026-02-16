import { test as setup, expect } from '@playwright/test';

setup.setTimeout(60_000);

setup('register and authenticate', async ({ page }) => {
  // Generate unique email for this test run
  const email = `smoketest+${Date.now()}@totempowered.com`;
  const password = 'testtest123';

  console.log('Auth setup: registering', email);

  // Navigate to homepage
  await page.goto('/');

  // Click the Register button in the nav bar to open auth dialog
  await page.getByRole('button', { name: /register|sign up|create account/i }).click();

  // Wait for auth dialog to appear
  const authDialog = page.locator('div[role="dialog"]');
  await authDialog.waitFor({ state: 'visible', timeout: 15_000 });

  // Fill registration form
  // Email field
  const emailField = authDialog.getByRole('textbox', { name: /email/i }).or(
    authDialog.locator('input[type="email"], input[name="email"]').first()
  );
  await emailField.fill(email);

  // Password field
  const passwordField = authDialog.locator('input[type="password"]').first();
  await passwordField.fill(password);

  // Username field (if visible)
  const usernameField = authDialog.getByRole('textbox', { name: /username|display name/i });
  if (await usernameField.count() > 0) {
    await usernameField.fill('smoketest');
  }

  // Terms checkbox (if visible)
  const termsCheckbox = authDialog.getByRole('checkbox', { name: /terms|agree/i }).or(
    authDialog.locator('input[type="checkbox"]').first()
  );
  if (await termsCheckbox.count() > 0) {
    await termsCheckbox.check();
  }

  // Click submit button
  const submitButton = authDialog.getByRole('button', { name: 'Create Account' }).or(
    authDialog.locator('button[type="submit"]').first()
  );
  await submitButton.click();

  // Wait for successful registration - one of three possible outcomes
  await Promise.race([
    authDialog.waitFor({ state: 'hidden', timeout: 30_000 }),
    page.waitForURL('**/account**', { timeout: 30_000 }),
    page.waitForURL('**/', { timeout: 30_000 }),
  ]);

  // Verify authenticated state - at least one auth indicator should be visible
  const authIndicator = page.getByRole('button', { name: /log out|sign out|account|profile/i })
    .or(page.getByText(/welcome|account|profile/i))
    .or(page.locator('[class*="avatar"], [class*="user"], [class*="profile"]').first());

  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Save storageState for reuse in all tests
  await page.context().storageState({ path: '.auth/user.json' });

  console.log('Auth setup: registered', email);
});
