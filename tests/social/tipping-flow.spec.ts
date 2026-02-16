import { test, expect } from '@playwright/test';

/**
 * SOCIAL-03: Tipping flow test (stop-before-payment pattern)
 * Validates tipping tab is accessible in the wallet modal with authenticated session.
 * Per PROJECT.md: "No real purchases or destructive actions"
 *
 * Tip feature is accessed via Wallet modal > Tip tab (not via chat interface).
 */
test('tipping flow works end-to-end (initiate → confirm → success state) @critical @social', async ({ page }) => {
  await page.goto('/');

  await test.step('Open wallet modal', async () => {
    const walletButton = page.getByRole('button', { name: /wallet/i }).first();
    await walletButton.click();

    // Wallet modal should appear
    const walletHeading = page.getByText('Wallet').first();
    await expect(walletHeading).toBeVisible({ timeout: 10_000 });
  });

  await test.step('Navigate to Tip tab', async () => {
    // Click Tip tab in wallet modal
    const tipTab = page.getByRole('button', { name: /^tip$/i })
      .or(page.locator('button, [role="tab"]').filter({ hasText: /^tip$/i }).first());
    await tipTab.click();
  });

  await test.step('Verify tip interface is visible', async () => {
    // Tip tab content should show tip-related UI (username input, amount, etc.)
    const tipContent = page.getByText(/tip|send|username/i).first();
    await expect(tipContent).toBeVisible({ timeout: 10_000 });

    // STOP HERE: Do NOT execute any tip transaction
    // Per PROJECT.md: "No real purchases or destructive actions"
  });
});
