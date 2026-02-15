import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat WebSocket connection establishes successfully @critical @social', async ({ page }) => {
  // CRITICAL: Set up WebSocket listener BEFORE navigation
  // WebSocket connections establish during page load, so we must listen before goto()
  // TODO: Refine WebSocket URL predicate after inspecting live site DevTools Network tab (WS filter)
  const wsPromise = page.waitForEvent('websocket', {
    predicate: (ws) =>
      ws.url().includes('/chat') ||
      ws.url().includes('/ws') ||
      ws.url().includes('socket'),
    timeout: 15_000,
  });

  // Create ChatPage and navigate
  const chatPage = new ChatPage(page);
  await chatPage.goto();

  // Wait for WebSocket connection to establish
  const webSocket = await wsPromise;

  // Assert WebSocket is open (not closed)
  expect(webSocket.isClosed()).toBe(false);

  // Assert WebSocket URL matches expected pattern
  expect(webSocket.url()).toMatch(/chat|ws|socket/i);
});
