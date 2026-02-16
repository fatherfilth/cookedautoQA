import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * LoginPage — auth is triggered by clicking the Login button in the nav bar,
 * which opens a dialog overlay.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/';

  readonly loginButton: Locator;
  readonly authDialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Login button in the top nav bar
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Auth dialog/modal container — use div[role="dialog"] to avoid strict mode
    // violation (site has both <aside class="z-dialog"> and <div role="dialog">)
    this.authDialog = page.locator('div[role="dialog"]').first();
    // Scope form inputs to dialog to avoid matching nav elements
    this.emailInput = this.authDialog.getByRole('textbox', { name: /email/i }).or(
      this.authDialog.locator('input[type="email"], input[name="email"]').first()
    );
    // Use first() to avoid strict mode if multiple password fields exist
    this.passwordInput = this.authDialog.locator('input[type="password"]').first();
    this.submitButton = this.authDialog.getByRole('button', { name: /sign in|log in|submit|continue/i }).or(
      this.authDialog.locator('button[type="submit"]').first()
    );
    this.errorMessage = this.authDialog.getByRole('alert').or(
      this.authDialog.locator('[class*="error"], [class*="alert"]').first()
    );
  }

  /** Open auth dialog by navigating to homepage and clicking Login button */
  override async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.loginButton.click();
    await this.waitForReady();
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
    // Wait for auth dialog to appear after clicking Login button
    await this.authDialog.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
