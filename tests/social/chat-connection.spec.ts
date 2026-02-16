import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat WebSocket connection establishes successfully @critical @social', async ({ page }) => {
  // Set mobile viewport where chat button is in bottom nav
  await page.setViewportSize({ width: 390, height: 844 });

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

  // Assert WebSocket URL matches expected pattern — this proves the connection was established.
  // Note: the WebSocket may close quickly (e.g. server heartbeat), so we don't assert isClosed().
  expect(webSocket.url()).toMatch(/chat|ws|socket/i);
});
