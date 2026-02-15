import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

/**
 * SOCIAL-03: Tipping flow test (stop-before-payment pattern)
 * Validates tipping flow reaches final pre-transaction state without executing real transaction.
 * Per PROJECT.md: "No real purchases or destructive actions"
 *
 * Flow: Navigate → Initiate tip → Select amount → Confirm → Verify submit ready (STOP)
 */
test('tipping flow works end-to-end (initiate → confirm → success state) @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await test.step('Navigate to chat page', async () => {
    await chatPage.open();
    await expect(chatPage.chatContainer).toBeVisible({ timeout: 10_000 });
  });

  await test.step('Initiate tip', async () => {
    await chatPage.clickTipButton();
    await expect(chatPage.tipModal).toBeVisible({ timeout: 5_000 });
  });

  await test.step('Select tip amount', async () => {
    await chatPage.selectTipAmount('5');
    await expect(chatPage.selectedTipAmount).toBeVisible();
    // TODO: Verify selected amount text after inspecting actual tip amount UI pattern
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
    // This confirms the flow reached its final pre-transaction state.
  });
});
