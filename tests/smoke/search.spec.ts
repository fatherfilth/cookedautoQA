import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('search returns results and user can open a game @warning @smoke', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);
  await lobbyPage.open();

  // Search for a broad term likely to return results
  await lobbyPage.searchForGame('slots');

  // Press Enter to submit search or wait for results to update
  await lobbyPage.searchInput.press('Enter');

  // Wait for game grid to be visible (results loaded)
  await expect(lobbyPage.gameGrid).toBeVisible();

  // Assert at least 1 result exists
  const resultCount = await lobbyPage.gameGrid.locator('> *').count();
  expect(resultCount).toBeGreaterThan(0);

  // Click the first result
  await lobbyPage.clickFirstGame();

  // Assert navigation to game detail page
  await page.waitForURL('**/games/**');

  // Assert content loaded on detail page (heading visible)
  await expect(page.getByRole('heading').first()).toBeVisible();
});
