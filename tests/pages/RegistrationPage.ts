import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * RegistrationPage — auth is triggered by clicking the Register button in the nav bar,
 * which opens a dialog overlay.
 */
export class RegistrationPage extends BasePage {
  protected readonly path = '/';

  readonly registerButton: Locator;
  readonly authDialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;
  readonly termsCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    // Register button in the top nav bar
    this.registerButton = page.getByRole('button', { name: 'Register' });
    // Auth dialog/modal container — use div[role="dialog"] to avoid strict mode
    // violation (site has both <aside class="z-dialog"> and <div role="dialog">)
    this.authDialog = page.locator('div[role="dialog"]').first();
    // Scope form inputs to dialog to avoid matching nav elements
    this.emailInput = this.authDialog.getByRole('textbox', { name: /email/i }).or(
      this.authDialog.locator('input[type="email"], input[name="email"]').first()
    );
    // Use first() to avoid strict mode with confirm-password fields
    this.passwordInput = this.authDialog.locator('input[type="password"]').first();
    this.usernameInput = this.authDialog.getByRole('textbox', { name: /username|display name/i }).or(
      this.authDialog.locator('input[name="username"], input[name="displayName"]').first()
    );
    // "Create Account" button — use exact name to avoid matching "Register" tab
    this.submitButton = this.authDialog.getByRole('button', { name: 'Create Account' }).or(
      this.authDialog.locator('button[type="submit"]').first()
    );
    this.termsCheckbox = this.authDialog.getByRole('checkbox', { name: /terms|agree/i }).or(
      this.authDialog.locator('input[type="checkbox"]').first()
    );
  }

  /** Open auth dialog by navigating to homepage and clicking Register button */
  override async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.registerButton.click();
    await this.waitForReady();
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
    // Wait for auth dialog to appear after clicking Register button
    await this.authDialog.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
