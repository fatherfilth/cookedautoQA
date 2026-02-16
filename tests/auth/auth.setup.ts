import { test as setup, expect } from '@playwright/test';
import { getVerificationData } from '../helpers/verification-data.js';

setup.setTimeout(90_000);

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

  // Complete details verification form to avoid "Set your details" modal in tests
  try {
    console.log('Auth setup: starting verification');

    await page.goto('/account/settings?account_tab=verification&verification_modal=details');

    // Wait for "Basic Information" dialog
    const dialog = page.getByRole('dialog', { name: /basic information|set your details/i }).or(
      page.locator('div[role="dialog"]').filter({ hasText: /date of birth/i })
    );
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });

    const data = getVerificationData();

    // Fill text fields by their stable IDs
    await dialog.locator('#First-Name').fill(data.firstName);
    await dialog.locator('#Last-Name').fill(data.lastName);

    // Date of birth: 3 unlabeled selects in order (Day, Month, Year)
    const selects = dialog.locator('select');
    await selects.nth(0).selectOption(data.dateOfBirth.day);
    await selects.nth(1).selectOption(data.dateOfBirth.month);
    await selects.nth(2).selectOption(data.dateOfBirth.year);

    // Phone number
    await dialog.locator('#Phone-Number').fill(data.phone);

    // Address — two #Address inputs exist: first is autocomplete trigger (placeholder
    // "Start typing an address..."), second is the actual street address field (placeholder "Address").
    // Use the second one to avoid triggering autocomplete that could close/change the form.
    const addressInputs = dialog.locator('#Address');
    await addressInputs.nth(1).fill(data.address.line1);

    await dialog.locator('#City').fill(data.address.city);
    await dialog.locator('#State-Province-Region').fill(data.address.state);
    await dialog.locator('#Postcode').fill(data.address.postcode);

    // Country select (4th select in the dialog)
    await selects.nth(3).selectOption(data.address.country);

    // Submit — button starts disabled, should enable once all fields are filled
    const submitBtn = dialog.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Wait for the dialog to close (real success indicator)
    await dialog.waitFor({ state: 'hidden', timeout: 15_000 });

    console.log('Auth setup: verification complete');
  } catch (error) {
    // Screenshot on failure for debugging
    await page.screenshot({ path: 'test-results/debug-verification-failure.png' });
    console.warn('Auth setup: verification FAILED -', error instanceof Error ? error.message : 'unknown error');
  }

  // Save storageState for reuse in all tests
  await page.context().storageState({ path: '.auth/user.json' });

  console.log('Auth setup: registered', email);
});
