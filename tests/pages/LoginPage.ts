import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * LoginPage — auth is a dialog triggered by ?auth=register URL param,
 * not a dedicated /login page.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/?auth=register';

  readonly authDialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

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
    this.submitButton = page.getByRole('button', { name: /sign in|log in|login|submit|continue/i }).or(
      page.locator('button[type="submit"]').first()
    );
    this.errorMessage = page.getByRole('alert').or(
      page.locator('[class*="error"], [class*="alert"]').first()
    );
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithEnvCredentials(): Promise<void> {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      throw new Error(
        'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment'
      );
    }
    await this.login(email, password);
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Wait for auth dialog to appear after URL param triggers it
    await this.authDialog.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
