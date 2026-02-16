import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat messages are visible in the interface @critical @social', async ({ page }) => {
  // Set mobile viewport where chat button is in bottom nav
  await page.setViewportSize({ width: 390, height: 844 });

  // Navigate and open chat drawer
  const chatPage = new ChatPage(page);
  await chatPage.open();

  // Wait for chat drawer to be visible
  await expect(chatPage.chatDrawer).toBeVisible({ timeout: 10_000 });

  // Wait for at least one chat message to appear
  // Generous timeout for real-time apps (messages may take time to load)
  await expect(chatPage.chatMessages.first()).toBeVisible({ timeout: 15_000 });

  // Assert the first message has non-empty text content
  const messageText = await chatPage.chatMessages.first().textContent();
  expect(messageText).toBeTruthy();
  expect(messageText!.trim().length).toBeGreaterThan(0);

  // Assert multiple messages exist (chat should show history or active messages)
  const messageCount = await chatPage.chatMessages.count();
  expect(messageCount).toBeGreaterThan(0);
});
