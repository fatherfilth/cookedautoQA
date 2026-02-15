import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { AccountPage } from '../pages/AccountPage.js';
import { LobbyPage } from '../pages/LobbyPage.js';

test('login session persists across page navigation @critical @auth', async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);
  const lobbyPage = new LobbyPage(page);

  // Login
  await loginPage.open();
  await loginPage.loginWithEnvCredentials();
  await page.waitForURL('**/account**', { timeout: 15_000 }).catch(() => {});

  // Capture storage state after login
  const stateAfterLogin = await context.storageState();
  const sessionCookie = stateAfterLogin.cookies.find(
    c => c.name.includes('session') || c.name.includes('token') || c.name.includes('auth')
  );
  expect(sessionCookie).toBeDefined();
  // TODO: After live site inspection, update cookie name pattern to match actual session cookie

  // Navigate away to lobby
  await lobbyPage.open();
  await expect(lobbyPage.gameGrid.or(page.getByRole('heading').first())).toBeVisible();

  // Navigate back to account
  await accountPage.open();

  // Assert session persists - user still logged in
  await expect(
    accountPage.logoutButton.or(accountPage.username).or(page.getByText(/welcome|account|log out/i))
  ).toBeVisible({ timeout: 10_000 });

  // Verify storage state still has session cookie
  const stateAfterNav = await context.storageState();
  const persistedCookie = stateAfterNav.cookies.find(c => c.name === sessionCookie!.name);
  expect(persistedCookie).toBeDefined();
});
