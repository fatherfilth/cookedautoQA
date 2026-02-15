import { Page } from '@playwright/test';
import { config } from './test-config.js';

/**
 * Wait for all known loading spinners to disappear.
 * Uses explicit waitForSelector with state: 'hidden' — NOT networkidle.
 */
export async function waitForSpinnerGone(page: Page): Promise<void> {
  for (const selector of config.selectors.spinners) {
    const spinner = page.locator(selector).first();
    // Only wait if spinner exists — don't fail if it was never shown
    const isVisible = await spinner.isVisible().catch(() => false);
    if (isVisible) {
      await spinner.waitFor({
        state: 'hidden',
        timeout: config.timeouts.spinner,
      });
    }
  }
}

/**
 * Wait for a specific API response matching the URL pattern.
 * Use instead of networkidle for SPAs.
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { status?: number; timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? config.timeouts.apiResponse;
  const status = options?.status ?? 200;

  await page.waitForResponse(
    response => {
      const urlMatch = typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url());
      return urlMatch && response.status() === status;
    },
    { timeout }
  );
}
