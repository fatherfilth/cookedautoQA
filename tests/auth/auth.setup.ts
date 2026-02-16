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

  // Username field (if visible) — unique per attempt, max 16 chars
  const usernameField = authDialog.getByRole('textbox', { name: /username|display name/i });
  if (await usernameField.count() > 0) {
    await usernameField.fill(`s${Date.now()}`);
  }

  // Terms checkbox — click the label text which reliably toggles the custom checkbox
  const termsLabel = authDialog.getByText(/I confirm that I am at least/i);
  if (await termsLabel.count() > 0) {
    await termsLabel.click();
  } else {
    const termsCheckbox = authDialog.locator('#tos-checkbox');
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.click();
    }
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

  // Verify authenticated state — wallet button in nav indicates logged in
  const authIndicator = page.getByRole('button', { name: /wallet/i }).first();

  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Save storageState for reuse in all tests
  await page.context().storageState({ path: '.auth/user.json' });

  console.log('Auth setup: registered', email);
});
