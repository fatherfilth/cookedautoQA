import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  protected readonly path = '/login';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i }).or(
      page.getByTestId('login-email')
    );
    this.passwordInput = page.getByLabel(/password/i).or(
      page.getByTestId('login-password')
    );
    this.submitButton = page.getByRole('button', { name: /sign in|log in|login/i }).or(
      page.getByTestId('login-submit')
    );
    this.errorMessage = page.getByRole('alert').or(
      page.getByTestId('login-error')
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
}
