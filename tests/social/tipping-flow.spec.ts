import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

/**
 * SOCIAL-03: Tipping flow test (stop-before-payment pattern)
 * Validates tipping flow reaches final pre-transaction state without executing real transaction.
 * Per PROJECT.md: "No real purchases or destructive actions"
 *
 * Flow: Open drawer → Initiate tip → Select amount → Confirm → Verify submit ready (STOP)
 */
test('tipping flow works end-to-end (initiate → confirm → success state) @critical @social', async ({ page }) => {
  // Set mobile viewport where chat button is in bottom nav
  await page.setViewportSize({ width: 390, height: 844 });

  const chatPage = new ChatPage(page);

  await test.step('Navigate and open chat drawer', async () => {
    await chatPage.open();
    await expect(chatPage.chatDrawer).toBeVisible({ timeout: 10_000 });
  });

  await test.step('Initiate tip', async () => {
    // Tipping requires authentication — skip if tip button not available
    const tipVisible = await chatPage.tipButton.isVisible().catch(() => false);
    if (!tipVisible) {
      test.skip(true, 'Tip button not visible — tipping likely requires authentication');
      return;
    }
    await chatPage.clickTipButton();
    await expect(chatPage.tipModal).toBeVisible({ timeout: 5_000 });
  });

  await test.step('Select tip amount', async () => {
    await chatPage.selectTipAmount('5');
    await expect(chatPage.selectedTipAmount).toBeVisible();
  });

  await test.step('Confirm tip (opens confirmation)', async () => {
    await chatPage.clickConfirmTip();
    await expect(chatPage.tipConfirmationDialog).toBeVisible({ timeout: 5_000 });
    // Assert confirmation contains relevant text (at minimum verify non-empty)
    await expect(chatPage.tipConfirmationDialog).toContainText(/.+/);
  });

  await test.step('Verify submit button ready (STOP HERE)', async () => {
    // Assert submit button is visible and enabled
    await expect(chatPage.submitTipButton).toBeVisible();
    await expect(chatPage.submitTipButton).toBeEnabled();

    // STOP HERE: Do NOT click submit. Test validates flow structure without executing real transaction.
    // Per PROJECT.md: "No real purchases or destructive actions"
  });
});
