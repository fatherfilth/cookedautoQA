import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LobbyPage } from '../pages/LobbyPage.js';

test('login session persists across page navigation @critical @auth', async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const lobbyPage = new LobbyPage(page);

  // Login via auth dialog
  await loginPage.open();
  await loginPage.loginWithEnvCredentials();

  // Wait for dialog to close or redirect
  await Promise.race([
    loginPage.authDialog.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {}),
    page.waitForURL('**/account**', { timeout: 15_000 }).catch(() => {}),
    page.waitForURL('**/', { timeout: 15_000 }).catch(() => {}),
  ]);

  // Capture storage state after login
  const stateAfterLogin = await context.storageState();
  const sessionCookie = stateAfterLogin.cookies.find(
    c => c.name.includes('session') || c.name.includes('token') || c.name.includes('auth')
  );
  expect(sessionCookie).toBeDefined();

  // Navigate away to lobby
  await lobbyPage.open();
  await expect(lobbyPage.gameGrid.or(page.getByRole('heading').first())).toBeVisible();

  // Navigate back to homepage
  await page.goto('/');

  // Assert session persists — user still logged in (auth indicator visible)
  await expect(
    page.getByRole('button', { name: /log out|sign out|account|profile/i }).or(
      page.getByText(/welcome|account|log out/i)
    ).or(
      page.locator('[class*="avatar"], [class*="user"], [class*="profile"]').first()
    )
  ).toBeVisible({ timeout: 10_000 });

  // Verify storage state still has session cookie
  const stateAfterNav = await context.storageState();
  const persistedCookie = stateAfterNav.cookies.find(c => c.name === sessionCookie!.name);
  expect(persistedCookie).toBeDefined();
});
