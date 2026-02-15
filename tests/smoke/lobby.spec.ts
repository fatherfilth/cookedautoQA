import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('lobby page displays game categories and game grid @warning @smoke', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);
  await lobbyPage.open();

  // Assert categories are visible
  await expect(lobbyPage.gameCategories).toBeVisible();

  // Assert game grid is visible
  await expect(lobbyPage.gameGrid).toBeVisible();

  // Assert game grid has at least 1 child element (game tile)
  await expect(lobbyPage.gameGrid.locator('> *').first()).toBeVisible();
});
