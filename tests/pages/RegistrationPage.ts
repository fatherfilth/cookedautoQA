import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class RegistrationPage extends BasePage {
  protected readonly path = '/register';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;
  readonly termsCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i }).or(
      page.getByTestId('register-email')
    );
    this.passwordInput = page.getByLabel(/password/i).or(
      page.getByTestId('register-password')
    );
    this.usernameInput = page.getByRole('textbox', { name: /username|display name/i }).or(
      page.getByTestId('register-username')
    );
    this.submitButton = page.getByRole('button', { name: /sign up|register|create account/i }).or(
      page.getByTestId('register-submit')
    );
    this.termsCheckbox = page.getByRole('checkbox', { name: /terms|agree/i }).or(
      page.getByTestId('register-terms')
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
      await this.usernameInput.fill(data.username);
    }
  }
}
