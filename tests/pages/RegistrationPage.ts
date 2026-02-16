import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * RegistrationPage — same auth dialog as login, triggered by ?auth=register URL param.
 * No separate /register page exists.
 */
export class RegistrationPage extends BasePage {
  protected readonly path = '/?auth=register';

  readonly authDialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;
  readonly termsCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    // Auth dialog/modal container
    this.authDialog = page.getByRole('dialog').or(
      page.locator('[class*="modal"], [class*="dialog"], [class*="auth"]').first()
    );
    this.emailInput = page.getByRole('textbox', { name: /email/i }).or(
      page.locator('input[type="email"], input[name="email"]').first()
    );
    this.passwordInput = page.getByLabel(/password/i).or(
      page.locator('input[type="password"]').first()
    );
    this.usernameInput = page.getByRole('textbox', { name: /username|display name/i }).or(
      page.locator('input[name="username"], input[name="displayName"]').first()
    );
    this.submitButton = page.getByRole('button', { name: /sign up|register|create account|submit|continue/i }).or(
      page.locator('button[type="submit"]').first()
    );
    this.termsCheckbox = page.getByRole('checkbox', { name: /terms|agree/i }).or(
      page.locator('input[type="checkbox"]').first()
    );
  }

  /** Fill registration form but do NOT submit (stop-before-payment pattern) */
  async fillForm(data: {
    email: string;
    password: string;
    username?: string;
  }): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    if (data.username) {
      const usernameVisible = await this.usernameInput.isVisible().catch(() => false);
      if (usernameVisible) {
        await this.usernameInput.fill(data.username);
      }
    }
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Wait for auth dialog to appear
    await this.authDialog.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
