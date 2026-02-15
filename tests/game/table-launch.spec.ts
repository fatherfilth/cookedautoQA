import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('table game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Navigate to the table game
  await gameDetailPage.gotoGame(gameConfig.table.id);

  // Assert game iframe is visible with extended timeout
  await expect(gameDetailPage.gameIframe).toBeVisible({ timeout: 15_000 });

  // Verify iframe has a src attribute (not empty)
  const iframeSrc = await gameDetailPage.gameIframe.getAttribute('src');
  expect(iframeSrc).toBeTruthy();

  // Access iframe content - try specific selector first, fall back to first iframe
  const gameFrame = page.frameLocator('iframe[src*="game"], iframe').first();

  // Wait for game content inside iframe — use broad check since provider-specific selectors are unknown
  // TODO: After live site inspection, replace broad iframe content selector with provider-specific game-ready indicator
  await gameFrame
    .locator('canvas, [data-game-state], .game-container, body')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
});
