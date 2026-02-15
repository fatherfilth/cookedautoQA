import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AccountPage extends BasePage {
  protected readonly path = '/account';

  readonly username: Locator;
  readonly email: Locator;
  readonly balanceDisplay: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByTestId('account-username').or(
      page.getByRole('heading', { name: /profile|account/i })
    );
    this.email = page.getByTestId('account-email').or(
      page.getByText(/.*@.*\..*/)
    );
    this.balanceDisplay = page.getByTestId('account-balance').or(
      page.getByRole('status')
    );
    this.logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i }).or(
      page.getByTestId('logout')
    );
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
