import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('authenticated session persists across page navigation @critical @auth', async ({ page, context }) => {
  const lobbyPage = new LobbyPage(page);

  // Navigate to homepage - storageState will be loaded automatically by Playwright
  await page.goto('/');

  // Verify authenticated state - auth indicator should be visible
  const authIndicator = page.getByRole('button', { name: /log out|sign out|account|profile/i })
    .or(page.getByText(/welcome|account|profile/i))
    .or(page.locator('[class*="avatar"], [class*="user"], [class*="profile"]').first());

  await expect(authIndicator).toBeVisible({ timeout: 15_000 });

  // Capture storage state after initial load
  const stateAfterLoad = await context.storageState();
  const sessionCookie = stateAfterLoad.cookies.find(
    c => c.name.includes('session') || c.name.includes('token') || c.name.includes('auth')
  );
  expect(sessionCookie).toBeDefined();

  // Navigate away to lobby
  await lobbyPage.open();
  await expect(lobbyPage.gameGrid.or(page.getByRole('heading').first())).toBeVisible();

  // Navigate back to homepage
  await page.goto('/');

  // Assert session persists — user still logged in (auth indicator still visible)
  await expect(authIndicator).toBeVisible({ timeout: 10_000 });

  // Verify storage state still has session cookie
  const stateAfterNav = await context.storageState();
  const persistedCookie = stateAfterNav.cookies.find(c => c.name === sessionCookie!.name);
  expect(persistedCookie).toBeDefined();
});
