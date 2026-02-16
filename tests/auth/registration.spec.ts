import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage.js';

test('registration flow completes step-by-step without creating account @critical @auth', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  // Open auth dialog via URL param
  await registrationPage.open();

  // Verify auth dialog appeared
  await expect(registrationPage.authDialog).toBeVisible();

  // Generate unique test data
  const testEmail = `test-monitor-${Date.now()}@example.com`;

  // Fill form using RegistrationPage.fillForm() — stop-before-payment pattern
  await registrationPage.fillForm({
    email: testEmail,
    password: 'SecureTestPass123!',
    username: 'test-monitor',
  });

  // Verify form fields accepted input
  await expect(registrationPage.emailInput).toHaveValue(testEmail);
  await expect(registrationPage.passwordInput).not.toBeEmpty();

  // If terms checkbox exists, check it
  const termsVisible = await registrationPage.termsCheckbox.isVisible().catch(() => false);
  if (termsVisible) {
    await registrationPage.termsCheckbox.check();
  }

  // Assert submit button is visible and enabled (but DO NOT CLICK IT)
  await expect(registrationPage.submitButton).toBeVisible();
  await expect(registrationPage.submitButton).toBeEnabled();

  // STOP HERE: Do NOT click submit — validates form structure without creating real accounts
});
