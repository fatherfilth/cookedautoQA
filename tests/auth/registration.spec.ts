import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage.js';

test('registration flow completes step-by-step without creating account @critical @auth', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  // Open auth dialog via Register button click
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

  // Verify email field accepted input
  await expect(registrationPage.emailInput).toHaveValue(testEmail);

  // Assert submit button is visible and enabled (but DO NOT CLICK IT)
  await expect(registrationPage.submitButton).toBeVisible();
  await expect(registrationPage.submitButton).toBeEnabled();

  // STOP HERE: Do NOT click submit — validates form structure without creating real accounts
});
