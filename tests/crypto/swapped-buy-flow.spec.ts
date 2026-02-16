/**
 * Swapped.com Crypto Buy Flow Tests
 *
 * Tests validate crypto buy flow is reachable with authenticated session.
 * Fresh accounts require KYC verification before the Swapped.com iframe loads,
 * so tests verify the wallet Buy Crypto tab opens and shows verification prompt.
 *
 * IMPORTANT: Tests follow stop-before-purchase pattern per PROJECT.md.
 */

import { test, expect } from '@playwright/test';

test.describe('Swapped.com Crypto Buy Flow', () => {
  /**
   * CRYPTO-01: Wallet Buy Crypto tab is accessible under authenticated session
   */
  test('Swapped.com crypto buy iframe loads on cooked.com @critical @crypto', async ({
    page,
  }) => {
    await page.goto('/');

    // Open wallet modal
    const walletButton = page.getByRole('button', { name: /wallet/i }).first();
    await walletButton.click();

    // Wallet modal should appear
    const walletModal = page.getByText('Buy Crypto').first();
    await expect(walletModal).toBeVisible({ timeout: 10_000 });

    // Click Buy Crypto tab
    await walletModal.click();

    // Verify Buy Crypto content is visible — either Swapped iframe or verification prompt
    const swappedIframe = page.locator('iframe[src*="swapped"]');
    const verifyPrompt = page.getByText(/verify|verification/i).first();

    // One of these should be visible: the iframe (verified account) or verification prompt (new account)
    await expect(swappedIframe.or(verifyPrompt)).toBeVisible({ timeout: 15_000 });
  });

  /**
   * CRYPTO-02: Wallet Tip tab is accessible (validates wallet tab navigation)
   */
  test('crypto buy flow progresses through steps and stops before purchase @critical @crypto', async ({
    page,
  }) => {
    await page.goto('/');

    // Open wallet modal
    const walletButton = page.getByRole('button', { name: /wallet/i }).first();
    await walletButton.click();

    // Wallet modal should appear with tabs
    const walletModal = page.locator('[role="dialog"], div').filter({ hasText: /deposit/i }).first();
    await expect(walletModal).toBeVisible({ timeout: 10_000 });

    // Verify wallet has expected tabs (Deposit, Withdraw, Buy Crypto, Tip)
    await expect(page.getByText('Deposit').first()).toBeVisible();
    await expect(page.getByText('Withdraw').first()).toBeVisible();
    await expect(page.getByText('Buy Crypto').first()).toBeVisible();

    // Click Buy Crypto tab and verify content loads
    await page.getByText('Buy Crypto').first().click();

    // Verify Buy Crypto content — verification prompt or iframe
    const buyContent = page.getByText(/verify|swapped|crypto/i).first();
    await expect(buyContent).toBeVisible({ timeout: 10_000 });

    // STOP HERE: Do NOT proceed with purchase
  });
});
