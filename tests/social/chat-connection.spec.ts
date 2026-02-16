import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat WebSocket connection establishes successfully @critical @social', async ({ page }) => {
  // CRITICAL: Set up WebSocket listener BEFORE navigation
  // WebSocket connections may establish during page load or when drawer opens
  const wsPromise = page.waitForEvent('websocket', {
    predicate: (ws) =>
      ws.url().includes('/chat') ||
      ws.url().includes('/ws') ||
      ws.url().includes('socket'),
    timeout: 20_000,
  });

  // Navigate to homepage
  await page.goto('/');

  // Open chat drawer
  const chatPage = new ChatPage(page);
  await chatPage.openDrawer();

  // Wait for WebSocket connection to establish
  const webSocket = await wsPromise;

  // Assert WebSocket is open (not closed)
  expect(webSocket.isClosed()).toBe(false);

  // Assert WebSocket URL matches expected pattern
  expect(webSocket.url()).toMatch(/chat|ws|socket/i);
});
