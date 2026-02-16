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

    // Wait for verification form/modal to appear
    const verificationForm = page.locator('div[role="dialog"]').or(
      page.locator('form').filter({ hasText: /details|verification|name|date of birth/i })
    );
    await verificationForm.waitFor({ state: 'visible', timeout: 15_000 });

    // Get fake identity data
    const data = getVerificationData();

    // Fill first name
    const firstNameField = page.getByLabel(/first name/i).or(
      page.locator('input[name*="first" i], input[placeholder*="first" i]').first()
    );
    await firstNameField.fill(data.firstName);

    // Fill last name
    const lastNameField = page.getByLabel(/last name/i).or(
      page.locator('input[name*="last" i], input[placeholder*="last" i]').first()
    );
    await lastNameField.fill(data.lastName);

    // Fill date of birth (try dropdowns first, fallback to text inputs)
    const dayField = page.locator('select[name*="day" i]').or(
      page.locator('input[name*="day" i], input[placeholder*="day" i]').first()
    );
    if (await dayField.count() > 0) {
      const tagName = await dayField.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await dayField.selectOption(data.dateOfBirth.day);
      } else {
        await dayField.fill(data.dateOfBirth.day);
      }
    }

    const monthField = page.locator('select[name*="month" i]').or(
      page.locator('input[name*="month" i], input[placeholder*="month" i]').first()
    );
    if (await monthField.count() > 0) {
      const tagName = await monthField.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await monthField.selectOption(data.dateOfBirth.month);
      } else {
        await monthField.fill(data.dateOfBirth.month);
      }
    }

    const yearField = page.locator('select[name*="year" i]').or(
      page.locator('input[name*="year" i], input[placeholder*="year" i]').first()
    );
    if (await yearField.count() > 0) {
      const tagName = await yearField.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await yearField.selectOption(data.dateOfBirth.year);
      } else {
        await yearField.fill(data.dateOfBirth.year);
      }
    }

    // Fill address line 1
    const addressField = page.getByLabel(/address|street/i).first().or(
      page.locator('input[name*="address" i], input[placeholder*="address" i]').first()
    );
    await addressField.fill(data.address.line1);

    // Fill city
    const cityField = page.getByLabel(/city|town/i).or(
      page.locator('input[name*="city" i], input[placeholder*="city" i]').first()
    );
    await cityField.fill(data.address.city);

    // Fill postcode
    const postcodeField = page.getByLabel(/postcode|postal|zip/i).or(
      page.locator('input[name*="postcode" i], input[name*="postal" i], input[name*="zip" i]').first()
    );
    await postcodeField.fill(data.address.postcode);

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit|save|confirm|continue/i });
    await submitButton.click();

    // Wait for success indication (form closes, success message, or URL changes)
    await Promise.race([
      verificationForm.waitFor({ state: 'hidden', timeout: 15_000 }),
      page.waitForURL('**/account**', { timeout: 15_000 }),
      page.getByText(/success|verified|complete/i).waitFor({ state: 'visible', timeout: 15_000 }),
    ]);

    console.log('Auth setup: verification complete');
  } catch (error) {
    console.warn('Auth setup: verification skipped -', error instanceof Error ? error.message : 'unknown error');
    // Continue anyway — tests will see "Set your details" modal but can still run
  }

  // Save storageState for reuse in all tests
  await page.context().storageState({ path: '.auth/user.json' });

  console.log('Auth setup: registered', email);
});
