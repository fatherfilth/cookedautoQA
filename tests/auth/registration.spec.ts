import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage.js';

test('registration flow completes step-by-step without creating account @critical @auth', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  // Open registration page
  await registrationPage.open();

  // Generate unique test data
  const testEmail = `test-monitor-${Date.now()}@example.com`;

  // Fill form using RegistrationPage.fillForm() - already implements stop-before-payment pattern
  await registrationPage.fillForm({
    email: testEmail,
    password: 'SecureTestPass123!',
    username: 'test-monitor',
  });

  // Verify form fields accepted input
  await expect(registrationPage.emailInput).toHaveValue(testEmail);
  await expect(registrationPage.passwordInput).not.toBeEmpty();

  // If terms checkbox exists, check it
  if (await registrationPage.termsCheckbox.isVisible()) {
    await registrationPage.termsCheckbox.check();
  }

  // Assert submit button is visible and enabled (but DO NOT CLICK IT)
  await expect(registrationPage.submitButton).toBeVisible();
  await expect(registrationPage.submitButton).toBeEnabled();

  // STOP HERE: Do NOT click submit - this validates form structure without creating real accounts
  console.log('Registration flow validated - stopped before account creation');
});
