import { Page, Locator, FrameLocator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { cryptoConfig } from '../helpers/crypto-config.js';

/**
 * Page object for the Swapped.com crypto buy integration page.
 *
 * This page embeds the Swapped.com widget as an iframe and allows users to
 * purchase cryptocurrency using various payment methods.
 *
 * IMPORTANT: All selectors are broad fallback chains until live site inspection.
 * TODO: Refine selectors after inspecting production iframe structure.
 *
 * Isolation: Each test runs in a fresh Playwright BrowserContext (default behavior),
 * which prevents wallet state pollution between tests.
 */
export class SwappedIntegrationPage extends BasePage {
  /** Path to the crypto buy page on cooked.com */
  protected readonly path = cryptoConfig.buyPath;

  /**
   * Locator for the Swapped.com iframe element in the DOM.
   * Used for checking iframe element visibility only.
   * For interacting with iframe CONTENT, use swappedFrame instead.
   *
   * TODO: Refine selector after live site inspection.
   */
  readonly swappedIframe: Locator = this.page
    .locator(`iframe[src*="${cryptoConfig.iframeSrcPattern}"]`)
    .or(this.page.getByTestId('swapped-iframe'));

  /**
   * FrameLocator for interacting with content INSIDE the Swapped.com iframe.
   * Uses compound CSS selector (not .or()) per Phase 2 decision:
   * "FrameLocator with compound CSS selector instead of .or() method (API limitation workaround)".
   *
   * .first() ensures we target the first matching iframe if multiple exist.
   *
   * TODO: Refine selector after live site inspection.
   */
  readonly swappedFrame: FrameLocator = this.page
    .frameLocator(`iframe[src*="${cryptoConfig.iframeSrcPattern}"], iframe`)
    .first();

  /**
   * Amount input field within the Swapped.com iframe.
   * Broad selector covers common patterns (number input, text input, placeholder).
   *
   * TODO: Refine selector after live site inspection.
   */
  readonly amountInput: Locator = this.swappedFrame
    .locator('input[type="number"], input[type="text"], input[placeholder*="amount" i]')
    .first();

  /**
   * Payment method selection button within the Swapped.com iframe.
   * Targets first available payment option (Credit Card, Card, etc.).
   *
   * TODO: Refine selector after live site inspection.
   */
  readonly paymentMethodButton: Locator = this.swappedFrame
    .locator('button:has-text("Credit"), button:has-text("Card"), [data-testid="payment-method"]')
    .first();

  /**
   * Buy/Continue button within the Swapped.com iframe.
   * DO NOT CLICK — stop-before-purchase pattern enforced per PROJECT.md.
   *
   * TODO: Refine selector after live site inspection.
   */
  readonly buyButton: Locator = this.swappedFrame
    .locator('button:has-text("Buy"), button:has-text("Continue"), button[type="submit"]')
    .first();

  /**
   * Enter a purchase amount in the crypto buy form.
   * @param amount - Amount to enter (e.g., '50')
   */
  async enterAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
  }

  /**
   * Select the first available payment method.
   * Clicks the paymentMethodButton to choose a payment option.
   */
  async selectPaymentMethod(): Promise<void> {
    await this.paymentMethodButton.click();
  }

  /**
   * Override waitForReady to ensure the Swapped.com iframe loads completely.
   *
   * Wait sequence:
   * 1. Base page readiness (spinners gone)
   * 2. Iframe element exists and is visible in DOM
   * 3. Iframe internal content loaded (body visible)
   *
   * This ensures the iframe widget is fully rendered before tests interact with it.
   */
  async waitForReady(): Promise<void> {
    // 1. Wait for base page readiness
    await super.waitForReady();

    // 2. Wait for iframe element to be visible in DOM (15s timeout)
    await this.swappedIframe.waitFor({ state: 'visible', timeout: 15_000 });

    // 3. Wait for iframe internal content to load (30s timeout for external widget)
    // Broad selector (body) confirms the iframe rendered internal content
    await this.swappedFrame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
  }
}
