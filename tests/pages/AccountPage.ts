import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * AccountPage — path unknown, keeping /account as best guess.
 * May also be /settings, /profile, or redirect after login.
 * TODO: Determine actual account page path from live site after auth.
 */
export class AccountPage extends BasePage {
  protected readonly path = '/account';

  readonly username: Locator;
  readonly email: Locator;
  readonly balanceDisplay: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByRole('heading', { name: /profile|account/i }).or(
      page.locator('[class*="username"], [class*="displayName"]').first()
    );
    this.email = page.getByText(/.*@.*\..*/);
    this.balanceDisplay = page.getByRole('status').or(
      page.locator('[class*="balance"]').first()
    );
    this.logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i }).or(
      page.locator('button').filter({ hasText: /log out|sign out|logout/i }).first()
    );
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
