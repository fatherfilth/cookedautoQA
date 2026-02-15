import { Page, Locator } from '@playwright/test';
import { config } from '../helpers/test-config.js';
import { retryAction } from '../helpers/retry.js';
import { waitForSpinnerGone } from '../helpers/waits.js';

/**
 * Base class for all page objects. Provides:
 * - Navigation with retry (via retryAction)
 * - Explicit wait helpers (no networkidle)
 * - Selector helpers prioritizing role-based > data-testid > text
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Path relative to baseURL (e.g., '/login', '/lobby') */
  protected abstract readonly path: string;

  /** Navigate to this page's path with retry logic */
  async goto(): Promise<void> {
    await retryAction(
      async () => {
        await this.page.goto(this.path, {
          timeout: config.timeouts.navigation,
        });
      },
      { label: `navigate to ${this.path}` }
    );
  }

  /**
   * Wait until the page is "ready" — override in subclasses
   * to wait for page-specific indicators (hero element, data loaded, etc.)
   * Default: wait for spinners to disappear.
   */
  async waitForReady(): Promise<void> {
    await waitForSpinnerGone(this.page);
  }

  /** Navigate and wait for ready state */
  async open(): Promise<void> {
    await this.goto();
    await this.waitForReady();
  }

  /**
   * Selector helper: try data-testid first, fall back to role-based or text.
   * Follows RELY-02 selector priority:
   *   1. getByRole (mirrors accessibility tree)
   *   2. getByLabel (form fields)
   *   3. getByText (visible text)
   *   4. getByTestId (fallback for dynamic content)
   *
   * In practice, page objects should define locators directly using
   * the appropriate Playwright method. This helper is for cases where
   * a data-testid exists and should be preferred.
   */
  protected testIdOrFallback(
    testId: string,
    fallback: () => Locator
  ): Locator {
    // If data-testid exists on the page, prefer it for stability
    // Otherwise use the semantic fallback
    return this.page.getByTestId(testId).or(fallback());
  }
}
