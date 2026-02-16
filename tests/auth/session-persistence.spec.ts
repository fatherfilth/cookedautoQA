import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('authenticated session persists across page navigation @critical @auth', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);

  // Navigate to homepage - storageState will be loaded automatically by Playwright
  await page.goto('/');

  // Verify authenticated state — wallet button in nav indicates logged in
  const authIndicator = page.getByRole('button', { name: /wallet/i }).first();
  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Navigate away to lobby
  await lobbyPage.open();
  await expect(page.getByRole('heading', { name: /games/i }).first()).toBeVisible();

  // Navigate back to homepage
  await page.goto('/');

  // Assert session persists — user still logged in (wallet button still visible)
  await expect(authIndicator).toBeVisible({ timeout: 10_000 });
});
